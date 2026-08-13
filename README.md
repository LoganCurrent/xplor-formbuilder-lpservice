<p align="center">
  <img src="https://circleci.com/gh/BrandyBots/landing-page-service/tree/master.svg?style=svg&circle-token=e0fed51186ecd7820b00105686d630a2ac459309" alt="Build Status"/ >
</p>

# MT Landing Page Service
Landing page service for Mariana Tek clients using [MT Web Integrations v4](https://marianatek.com/docs/web-integrations/getting-started). 

## Lambdas 
The Landing Page Backend is an express app wrapped in a lambda. To get started:
1) cd in the `lambdas` directory
2) start the mysql/redis via docker-compose: `docker-compose up -d`
3) run lambdas via `npm run local` 

## Webapp
The front-end is a simple VueJS app that has the MT iframes embded into it. Simply run `npm run dev` to get it running.






