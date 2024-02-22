# Account Manager Code Challenge
## Introduction
This is my solution to the code challenge presented as a part of the hiring process at EBANX. It consists of writing a server that can handle some basic functionalities: depositing money to accounts, checking an account balance, withdrawing money from an account and trasferring money between accounts. It also has to have an endpoint that cleans the database for testing.

## My Solution
I chose to build my solution using Node and Typescript, since they are part of the stack I have the most experience working with. I choose to use an express server, due to its minimalistic and easy to use approach. For the persistance layer, even though it wasn't required, I decided to use (mongodb-memory-server)[https://github.com/nodkz/mongodb-memory-server], since it runs a mongod instance on memory, at cost of 7MB. It also has to download the mongod binary on the first server run, but, since the package is used for testing, if one wishes to change it to a persistent mongodb database, it is as easy as changing a connection string.

## Design
I chose to use the MVC design pattern, I have modeled an `AccountModel` using [mongoose](https://mongoosejs.com/). Then I implemented an `AccountController` which encapsulates the actions taken by the user. I have thought of creating an event handler layer, since all the events occur inside the same endpoint (`\event`), but I deemed my solution overengineered, so I divided the eventHandler between the routing (which identifies which type of event is being sent) and the controller, which outputted HTTP status code instead of a generic code.

## Developemnt Flow
**Disclamer**: If you are not reading this from this project's github page, it is highly recommended that you open the [issues page](https://github.com/tverderesi/code_challenge/issues) from the project, as the commits are linked to github issues.

I opted to use a method marginal to TDD, but instead of writing the codes before I have written the code, I decided to write then along the code, to ensure maximum coverage. I wrote tests for the Model, the connection to the database, and the controller. I opted not to write code for the routing layer because [https://ipkiss.pragmazero.com](https://ipkiss.pragmazero.com) would do the same tests as the code I have wrriten. After I have scaffolded the project on the `main` branch and created my [task list](https://github.com/tverderesi/code_challenge/issues/1), my development flow followed the following algorithm:

1. Plan the feature or document the bug in [GitHub issues](https://github.com/tverderesi/code_challenge/issues);
2. create a branch for each code or feature that was documented;
3. Code and write tests for each feature or bugfix;
4. Create a PR that solves that given issue
5. Merge the PR to the main branch.

## Dockerization
I have dockerized the solution with a simple dockerfile and docker-compose file. After I have done that, I tested the dockerized version of the code using  [https://ipkiss.pragmazero.com](https://ipkiss.pragmazero.com).

## Running the project
If you opt to use the dockrized version, simply navigate to the root of the project and run the following command:
```
docker-compose up
```

If you wish to use the code itself you have to run:
```
npm i
```
After the project has installed you have to build it using:
```
npm run build
```
Once the project has been built, you can run it by:
```
npm start
```

## End Notes
if you have any suggestions or if you encounter any issues, feel free to contribute in GitHub issues](https://github.com/tverderesi/code_challenge/issues). Feedback is highly appreciated.


