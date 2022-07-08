# OSRS Trade (Backend)
### DISCLAIMER!!!11!
I'm not a full time backend developer.

If you're evaluating me and my code skills/decisions, please keep in mind that I just built this server because I really needed. 
Think of this repo as a POC.

OSRS's API needs to be proxied, and I'm also using SocketIO, so the server was a must.

>"Okay, what *should* I evaluate then?"


[the frontend app](https://github.com/nickojs/osrs-web3-trade)

That app is hooked into a Heroku Dyno with everything set, so it should be ready to be tested. I also have a lot of storybook components, with MSW mocking calls. 

## To-do
The following list refers to the missing features of the app so far. I'll be done with that whenever possible.

- [ ] The trade itself - it's done using a trade window, that is set when both users agrees to start the trade. 
- [ ] Complete the "switch items" logic
- [ ] Minors bugs/enhancements needed (P2/P3 stuff)

## Running the server locally
> Don't ever, for any reason, do anything, to anyone, for any reason, ever, no matter what, no matter where, or who, or who you are with, or where you are going, or where you've been, ever, for any reason whatsoever.

To be honest, the current best way of running this server locally is to create a local postgresql DB, run Nest in dev mode and add the needed envs to the .env file.

But I created a not-ready-yet docker-compose file that helps with the process.

The only thing is: You gotta run the `init.sql` script manually because it's not working, for [?] reason. As I said before, backend is not my main skill. Be nice.

Just run `docker-compose up`, wait a bit and then get the osrs-db's container ID/name. Access its shell and run ` cd docker-entrypoint-initdb.d && psql -U postgres -f init.sql`. You can access the DB using Dbeaver or any other SQL tool to see if this worked out.


Also, check the [the frontend app](https://github.com/nickojs/osrs-web3-trade)'s readme to see how to run that locally.

