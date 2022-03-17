import os
import boto3
import json
dynamodb = boto3.resource('dynamodb')
tableName = os.environ["GAME_TABLE"]
table = dynamodb.Table(tableName)

def handler(event, context):
	body = json.loads(event.get("body"))
	user_input = body.get("input")
	game_id = body.get("gameId")

	# find number in dynamodb
	correct_number = fetch_from_dynamodb(game_id)

	# evaluate on guess
	response_message = evaluate_input(int(user_input), int(correct_number))
	
	response = {
		"statusCode": 200,
		"body": json.dumps({"message": response_message})
	}

	return response

def fetch_from_dynamodb(gameId):
	try:
		response = table.get_item(Key={"gameId": gameId})
		return response.get("Item").get("number")
	except Exception as e:
		print(e.response['Error']['Message'])
		return 500

def evaluate_input(input, correct_number):
	if input < correct_number:
		return "higher"
	if input > correct_number:
		return "lower"
	return "SPOT ON!"