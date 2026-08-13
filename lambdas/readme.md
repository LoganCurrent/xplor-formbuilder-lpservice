# Landing Page Backend 

| Status | Verb | Route                                    | Desc                                                                                              | Payload |   |
|--------|------|------------------------------------------|---------------------------------------------------------------------------------------------------|---------|---|
|        | GET  | /v2/landing-pages/mtoauth/callback       | Static endpoint for MT to hit when oauth is complete. Will redirect user to correct landing page. |         |   |
|        | GET  | /v2/landing-pages/:uuid/params           | Get Parameters/config for a landing page.                                                         |         |   |
|        | POST | /v2/landing-pages/:uuid/cart             | Get (or Create + fetch) a cart in MT.                                                             |         |   |
|        | POST | /v2/landing-pages/:uuid/capture-view     | Capture a user viewing a landing page.                                                            |         |   |
|        | POST | /v2/landing-pages/:uuid/capture-checkout | Capture a user viewing a landing page.                                                            |         |   |
|        |      |                                          |                                                                                                   |         |   |

## About
This Service uses router/controller/service pattern with the heavy logic being put into the service layer.
It also leverages Typeorm entities to interact with models established in the API repo -> note that for dev and test we sync this data 
 - meaning when typeorm will create tables if they do not exists. this is daangerous for production so use with care!

- `npm run local` -> run locally via serverless offline. routes are accessible via `localhost:3000/local/v2/landing-pages/`
    Beacause typeorm `sync` is true for dev/test enviroments, this should populate your tables.
- `npm run test` -> run unit tests
- `npm run test:integration` -> run integration tests 

I have included a docker compose file which will be used to test this locally as well as run the integraion tests against REAL 
mysql + redis servers.

## Deployment
Env vars are loaded via `serverless-dotenv-plugin` so follow the .env.STAGE convention. 

After you can deploy to the stage you want via `npx serverless deploy --stage STAGE`.


