import logging
from aiogram import Bot, Dispatcher, types

TOKEN = "{{ token }}" # Заполнится из настроек

bot = Bot(token=TOKEN)
dp = Dispatcher()

@dp.message()
async def echo(message: types.Message):
    await message.answer("Бот запущен и работает!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(dp.start_polling(bot))