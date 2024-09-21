# SweetFriend

## Installation

Python 3.12

```sh
git clone https://github.com/dmicz/SweetFriend.git
cd SweetFriend
pip install -r requirements.txt
python -m venv .venv
.venv/bin/setup.sh # linux
.venv\Scripts\activate.bat # windows
export FLASK_APP=api/app.py # linux
set FLASK_APP=api/app.py # windows
flask run --debug
```