from fastapi import FastAPI, BackgroundTasks, Request
from fastapi.responses import StreamingResponse
import zipfile
import io
from urllib.parse import parse_qs, unquote

app = FastAPI()

# База данных в оперативной памяти (для MVP)
# Ключ: email клиента, Значение: байты ZIP-архива
generated_assets = {}

def assemble_bot_archive(email: str, raw_body: str):
    buffer = io.BytesIO()
    payload_text = unquote(raw_body).lower()
    
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("core.py", "def init():\n    return 'Core initialized'\n")
        zip_file.writestr("README.txt", "1. Распакуйте архив\n2. Запустите core.py\n")
        
        modules_built = ["core"]
        
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
    
    # Сохраняем готовый архив в оперативную память сервера
    generated_assets[email] = buffer.getvalue()
    
    print("="*50, flush=True)
    print(f"✅ АКТИВ СОХРАНЕН В ПАМЯТИ ДЛЯ: {email}", flush=True)
    print(f"📥 Ждем запроса на скачивание...", flush=True)
    print("="*50, flush=True)

@app.post("/api/webhook/tilda")
async def handle_order(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    body_str = body.decode('utf-8')
    
    if "test=test" in body_str:
        return {"status": "success", "message": "Test OK"}

    parsed_data = parse_qs(body_str)
    email = parsed_data.get('email', parsed_data.get('Email', ['unknown_client@email.com']))[0]
    
    # Запускаем сборку
    background_tasks.add_task(assemble_bot_archive, email, body_str)
    return {"status": "success", "message": "Order processed"}

# ==========================================
# 🚀 НОВЫЙ ЭНДПОИНТ ДЛЯ ПРЯМОГО СКАЧИВАНИЯ
# ==========================================
@app.get("/api/download")
async def download_asset(email: str):
    # Проверяем, есть ли архив для этого email
    if email not in generated_assets:
        return {"error": "Архив еще не готов или Email указан неверно. Подождите 5 секунд и обновите страницу."}
    
    # Достаем архив из памяти
    zip_bytes = generated_assets[email]
    buffer = io.BytesIO(zip_bytes)
    
    # Отдаем файл напрямую в браузер клиенту
    return StreamingResponse(
        buffer, 
        media_type="application/zip", 
        headers={"Content-Disposition": "attachment; filename=telegram_bot_asset.zip"}
    )
