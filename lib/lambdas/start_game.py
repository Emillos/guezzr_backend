import os
import time
import random
import boto3
import json
dynamodb = boto3.resource('dynamodb')
tableName = os.environ["GAME_TABLE"]
table = dynamodb.Table(tableName)

def handler(event, context):
	response_code = 200
	message = ""

	# generate random number between 0 and 200
	random_number = random.randint(0,200)

	# create gameId
	game_id = "{}{}".format(time.time(), random.randint(0,1000))

	# create row in Dynamodb
	try:
		create_row(random_number, game_id)
		message = game_id
	except Exception as e:
		print("error: ", e)
		response_code = 500
		message = "There was an unexpected error"

	response = {
		"statusCode": response_code,
		"body": json.dumps({"message": message})
	}

	return response

def create_row(random_number, game_id):
	response = table.put_item(
		Item={
			"gameId": str(game_id),
			"number": random_number
		}
	)
	return response