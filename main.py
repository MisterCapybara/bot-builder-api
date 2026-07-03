from fastapi import FastAPI, BackgroundTasks, Request
import zipfile
import io
from urllib.parse import parse_qs, unquote

app = FastAPI()

def assemble_bot_archive(email: str, raw_body: str):
    buffer = io.BytesIO()
    
    # Расшифровываем кириллицу от Тильды и переводим в нижний регистр для жесткого поиска
    payload_text = unquote(raw_body).lower()
    
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        # Базовое ядро бота, которое получает каждый клиент
        zip_file.writestr("core.py", "def init():\n    return 'Core initialized'\n")
        
        modules_built = ["core"]
        
        # Сканируем запрос на наличие купленных модулей
        if "админк" in payload_text or "admin" in payload_text:
            zip_file.writestr("modules/admin.py", "def open_admin_panel():\n    print('Admin panel ready')\n")
            modules_built.append("admin")
            
        if "корзин" in payload_text or "cart" in payload_text:
            zip_file.writestr("modules/cart.py", "def add_to_cart():\n    print('Cart system ready')\n")
            modules_built.append("cart")
            
        if "заявок" in payload_text or "сбор" in payload_text:
            zip_file.writestr("modules/lead_catcher.py", "def catch_lead():\n    print('Lead catcher ready')\n")
            modules_built.append("lead_catcher")
            
    buffer.seek(0)
    
    # Жесткий вывод спецификации в логи
    print("="*50, flush=True)
    print(f"✅ АКТИВ СГЕНЕРИРОВАН для: {email}", flush=True)
    print(f"📦 Состав модулей в ZIP: {', '.join(modules_built)}", flush=True)
    print("="*50, flush=True)

@app.post("/api/webhook/tilda")
async def handle_order(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    body_str = body.decode('utf-8')
    
    if "test=test" in body_str:
        print("🟢 Тестовый стук от Tilda успешно одобрен!", flush=True)
        return {"status": "success", "message": "Test OK"}

    parsed_data = parse_qs(body_str)
    email = parsed_data.get('email', parsed_data.get('Email', ['unknown_client@email.com']))[0]
    
    background_tasks.add_task(assemble_bot_archive, email, body_str)
    return {"status": "success", "message": "Order processed"}
