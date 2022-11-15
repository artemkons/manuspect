# Установка
Клонирование проекта с подмодулями
1. `git clone --recurse-submodules git@github.com:artemkons/manuspect.git`
2. `yarn`

# Запуск
Web: `yarn start:web`
Desktop: `yarn start:desktop`

# Troubleshooting
If workspaces can't be imported, delete yarn.lock in this directory. [Issue](https://github.com/yarnpkg/berry/issues/839)
