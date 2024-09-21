from twilio.rest import Client

account_sid = ''
auth_token = ''
client = Client('', '')

message = client.messages.create(
  from_='+18449053950',
  body='Hello from Twilio',
  to='+16467976340'
  
)
#to='+18777804236'
print(message.sid)
