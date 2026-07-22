import random
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base, get_db, User, init_db
from auth import get_password_hash, verify_password, create_token, verify_token
from pydantic import BaseModel, EmailStr
from fastapi_mail import FastMail, MessageSchema, ConnectionConfig, MessageType

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# НАЛАШТУВАННЯ MAILTRAP (ДЛЯ ТЕСТУВАННЯ)
conf = ConnectionConfig(
    MAIL_USERNAME="44f403142b55f7",
    MAIL_PASSWORD="f04bea4eff3b15", # <--- ВСТАВЬ СЮДА СВОЙ ПОЛНЫЙ ПАРОЛЬ ОТ MAILTRAP
    MAIL_FROM="test@botbuilder.pro",
    MAIL_PORT=2525,
    MAIL_SERVER="sandbox.smtp.mailtrap.io",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
    VALIDATE_CERTS=False
)

@app.on_event("startup")
async def startup():
    await init_db()

class UserCreate(BaseModel):
    name: str
    email: EmailStr
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class VerifyOTP(BaseModel):
    email: EmailStr
    otp: str

@app.post("/api/auth/register")
async def register(req: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    existing_user = result.scalars().first()

    # Генеруємо новий 6-значний код
    otp_code = str(random.randint(100000, 999999))

    if existing_user:
        if existing_user.is_verified:
            # Если почта уже подтверждена — не пускаем
            raise HTTPException(status_code=400, detail="Email already registered")
        else:
            # Если не подтверждена — обновляем данные и даем новую попытку
            existing_user.name = req.name
            existing_user.hashed_password = get_password_hash(req.password)
            existing_user.otp_code = otp_code
    else:
        # Если юзера вообще нет — создаем с нуля
        new_user = User(
            name=req.name,
            email=req.email,
            hashed_password=get_password_hash(req.password),
            is_verified=False,
            otp_code=otp_code
        )
        db.add(new_user)

    await db.commit()

    # Формуємо та відправляємо HTML лист
    html = f"""
    <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #eaeaea; border-radius: 10px; padding: 20px;">
        <h2 style="color: #2563eb; text-align: center;">BotBuilder Pro</h2>
        <p style="color: #4b5563; font-size: 16px;">Вітаємо! Ваш код для підтвердження реєстрації:</p>
        <h1 style="background: #f3f4f6; padding: 15px; text-align: center; letter-spacing: 8px; border-radius: 8px; color: #111827;">{otp_code}</h1>
        <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 20px;">Якщо ви не реєструвалися на нашому сайті, просто проігноруйте цей лист.</p>
    </div>
    """
    message = MessageSchema(
        subject="Код підтвердження - BotBuilder Pro",
        recipients=[req.email],
        body=html,
        subtype=MessageType.html
    )
    fm = FastMail(conf)
    try:
        await fm.send_message(message)
    except Exception as e:
        print(f"Помилка відправки листа: {e}")

    return {"message": "User created/updated, OTP sent"}

@app.post("/api/auth/verify")
async def verify_email(req: VerifyOTP, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    if user.is_verified:
        raise HTTPException(status_code=400, detail="Already verified")
    if user.otp_code != req.otp:
        raise HTTPException(status_code=400, detail="Invalid OTP code")
        
    user.is_verified = True
    user.otp_code = None # Очищаємо код безпеки після використання
    await db.commit()
    
    # БЕЗШОВНИЙ ВХІД: Одразу видаємо бойовий токен після перевірки коду!
    access_token = create_token(data={"sub": user.email, "type": "access"})
    return {
        "status": "verified",
        "token": access_token,
        "name": user.name,
        "is_verified": user.is_verified
    }

@app.post("/api/auth/login")
async def login(req: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email))
    user = result.scalars().first()
    if not user or not verify_password(req.password, user.hashed_password):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    access_token = create_token(data={"sub": user.email, "type": "access"})
    return {"token": access_token, "name": user.name, "is_verified": user.is_verified}

class AssetRequest(BaseModel):
    cart: list[str]
    moduleSettings: dict

@app.post("/api/generate-asset")
async def generate_asset(req: AssetRequest, email: str = Depends(verify_token), db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalars().first()
    if not user or not user.is_verified:
        raise HTTPException(status_code=403, detail="Пошта не підтверджена")
        
    import io
    import zipfile
    from fastapi.responses import StreamingResponse
    
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
        zip_file.writestr("bot_project/README.md", "# Your BotBuilder Pro Project\nGenerated successfully.")
        for module_id in req.cart:
            zip_file.writestr(f"bot_project/modules/{module_id}.py", f"# Module: {module_id}\n# Settings: {req.moduleSettings.get(module_id, {})}")
            
    zip_buffer.seek(0)
    return StreamingResponse(
        iter([zip_buffer.getvalue()]), 
        media_type="application/x-zip-compressed", 
        headers={"Content-Disposition": "attachment; filename=bot_asset.zip"}
    )