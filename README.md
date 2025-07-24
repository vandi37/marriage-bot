# marriage bot

## Project info

- This project is created by [vandi](https://github.com/vandi37)
- It's a simple telegram bot used for creating multiaple online marriages between different users
  - The bot has a russian interface
  - The bot has an inline mode for simplier usage without adding it to chats

### Some commands of the bot

1. +брак @mention/reply to message
   - sends a marriage request with a comfirm button for the other person
2. -брак/развод {marriage id}
   - sends a confirm button to comfirm the divorce
3. брак {marriage id}
   - shows information about the marriage
4. браки
   - shows information about all your marriages
5. стата
   - shows information about the bot database (total number of marriages and total number of unique users)
6. все браки
   - a command only for the creator
   - sends a json file with data about all marriages

### inline mode

1. @{bot username}
   - shows information about all your marriages
3. @{bot username} {marriage id}
   1. sends a confirm button to comfirm the divorce
   2. shows information about the marriage
3. @{bot username} @mention
   - sends a marriage request with a comfirm button for the other person

## Quick start

1. Downdload the project
   
  ```shell
  git clone https://github.com/vandi37/marriage-bot.git
  cd marriage-bot
  ```
2. Create env file

  ```shell
  touch .env # or other way to create this file
  code .env # or other way to edit the file
  ```
  Copy the [example file](.example.env) and enter your own data 
  All the meaning of each variable is written, however, I will repeat it here
  - CREATOR=your telegram id. you can find it using other bots etc
  - BOT_TOKEN=the token of your bot, that you can get in [bot father](https://t.me/BotFather)
  - DATABASE_PATH=your path for the database directory, where all the data would be stored, it's optional the default is ./data
  - LOG_PATH=your path for the logs directory, where all the logs would be stored, it's optional the default is ./logs
  - LOG_LEVEL=the level of the logs you would like to be in the console, it's optional the default is debug
  - LOG_INTO_CONSOLE=do you want to write the logs to the console, use on to turn on/true/yes/1 other values including not adding this variable are off
  - MIGRATIONS_PATT=the path to migrations, it's better to use the absolute path to marriage-bot/migrations, or you could use other migrations if you want to use some other migrations

3. Run docker compose

  ```shell
  docker-compose up --build # use -d, --detach for detach mode (running the container in background)
  ```

