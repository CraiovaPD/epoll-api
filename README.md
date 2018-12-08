# epoll-api
API server for E Poll application

# API Endpoints

### /user/register

POST data:
```Json
{
	"grantType": "implicit",
	"clientId": "epoll-web",
	"state": "some-random-state-string",
	"accountKitCode": "code retrieved from the web",
	"firstname": "dragos",
	"lastname": "sebestin"
}
```

### /user/oauth

POST data:
```Json
{
	"grantType": "implicit",
	"clientId": "epoll-web",
	"state": "some-random-state-string",
	"accountKitCode": "code retrieved from the web"
}
```

### /user/oauth/refresh_token

POST data:
```Json
{
	"clientId": "epoll-web",
	"clientSecret": "secret1",
	"state": "some-random-state-string",
	"refreshToken": "some-old-refresh-token-id"
}
```
