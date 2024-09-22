# SweetFriend

## Installation

Python 3.12

```sh
git clone https://github.com/dmicz/SweetFriend.git
cd SweetFriend
python -m venv .venv
.venv/bin/setup.sh # linux
.venv\Scripts\activate.bat # windows
pip install -r requirements.txt
export FLASK_APP=api/app.py # linux
set FLASK_APP=api/app.py # windows
flask run --debug
```

## React + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh
