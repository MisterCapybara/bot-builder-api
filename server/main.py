from fastapi import FastAPI
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List
import io
import zipfile

app = FastAPI()

class BotConfig(BaseModel):
    email: str
    modules: List[str]

@app.post("/api/generate")
async def generate_bot(config: BotConfig):
    zip_buffer = io.BytesIO()
    
    with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
        zip_file.writestr("core.py", "import asyncio\n\nasync def main():\n    print('Core active')\n\nif __name__ == '__main__':\n    asyncio.run(main())")
        zip_file.writestr("requirements.txt", "aiogram==3.4.1\npython-dotenv==1.0.1")
        
        if "admin" in config.modules:
            zip_file.writestr("modules/admin.py", "def setup_admin():\n    pass")
        if "cart" in config.modules:
            zip_file.writestr("modules/cart.py", "def setup_cart():\n    pass")
            
    zip_buffer.seek(0)
    
    return StreamingResponse(
        zip_buffer,
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename=b2b_asset_{config.email}.zip"}
    )
