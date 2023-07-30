Started working on a cat database based on a AWS API Gateway in comination of Dynamodb
Requirements:
- AWS CLI
- SAM CLI
- Docker

The database needs to be created on the provided docker
The database structure and content can be found in the db-data directory.

The entire api functioning can be found in the openai.yaml

Build functions are the get functions:
http://127.0.0.1:3000/cats/
http://127.0.0.1:3000/cat/{breed}

At this moment breed is case sensitive please look at the db data provided for the correct pronunciation.

Steps to start the api server:

- Start docker <code>docker-compose up</code>
- Create the database "aws dynamodb create-table --cli-input-json file://db-data/cat-table.json --endpoint-url http://localhost:8000"
- Make sure your aws cli config api key and secret have 'local'
- I used my PHPstorm to import the cat-data to the dynamodb
- Run <code>sam build</code>
- Run <code>sam local start-api --docker-network catapi_dynamodb</code>
- It will provide all usable end points