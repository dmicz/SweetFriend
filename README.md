# SweetFriend

SweetFriend is a comprehensive diabetes management app designed to help users track their glucose levels, log meals and exercises, and receive personalized insights powered by AI.

## Technologies Used

- **React:** To build our frontend user interfaces, enabling graph visualizations and easy logging.
- **Flask:** Used for developing the API that serves the frontend and interacts with our services.
- **MongoDB:** Our database used for storing user logs and data efficiently, allowing flexible schema design.
- **Dexcom API:** Used for accessing real-time glucose data from users' Dexcom devices, facilitating seamless integration of vital health information.
- **Tune Studio:** Utilized for vision model inference (GPT-4o), specifically for accurately estimating carbohydrate content from food images using machine learning models.
- **Cerebras:** Provides super-fast AI chatbot inference, enhancing user interaction through quick and responsive conversations.
- **Twilio:** Used for sending user notifications and alerts, ensuring timely communication about glucose levels and other important health metrics.

## Installation

### Prerequisites
- Python 3.12

### Steps
```sh
git clone https://github.com/dmicz/SweetFriend.git
cd SweetFriend
python -m venv .venv

.venv/bin/setup.sh # For Linux
.venv\Scripts\activate.bat # For Windows

pip install -r requirements.txt

export FLASK_APP=api/app.py # For Linux
set FLASK_APP=api/app.py # For Windows

flask run --debug
```

## External/Open Source Resources
- [React](https://reactjs.org/)
- [Flask](https://flask.palletsprojects.com/)
- [MongoDB](https://www.mongodb.com/)
- [Dexcom API Documentation](https://developer.dexcom.com/)
- [Tune Studio](https://tunehq.ai/)
- [Cerebras](https://cerebras.ai/)
- [Twilio](https://www.twilio.com/)