from fastapi import FastAPI, BackgroundTasks, Request
import zipfile
import io
from urllib.parse import parse_qs

app = FastAPI()

def assemble_bot_archive(email: str):
    buffer = io.BytesIO()
    with zipfile.ZipFile(buffer, 'w', zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("core.py", "def init():\n    return 'Core initialized'\n")
        zip_file.writestr("plugins/base.py", "def run_base():\n    pass\n")
    
    buffer.seek(0)
    print("="*50)
    print(f"✅ АКТИВ СОЗДАН: ZIP-архив успешно собран для: {email}")
    print("="*50)

@app.post("/api/webhook/tilda")
async def handle_order(request: Request, background_tasks: BackgroundTasks):
    body = await request.body()
    body_str = body.decode('utf-8')
    
    if "test=test" in body_str:
        print("🟢 Тестовый стук от Tilda успешно принят и одобрен!")
        return {"status": "success", "message": "Test OK"}

    parsed_data = parse_qs(body_str)
    email = parsed_data.get('email', parsed_data.get('Email', ['unknown_client@email.com']))[0]
    
    background_tasks.add_task(assemble_bot_archive, email)
    return {"status": "success", "message": "Order processed"}
