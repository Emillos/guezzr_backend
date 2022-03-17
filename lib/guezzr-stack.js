const path = require('path')
const cdk = require('aws-cdk-lib')
const lambda = require('aws-cdk-lib/aws-lambda')
const apigateway = require('aws-cdk-lib/aws-apigateway')
const dynamodb = require('aws-cdk-lib/aws-dynamodb')
const iam = require('aws-cdk-lib/aws-iam')

const { Stack, Duration } = require('aws-cdk-lib');

class GuezzrStack extends Stack {
  /**
   *
   * @param {Construct} scope
   * @param {string} id
   * @param {StackProps=} props
   */
  constructor(scope, id, props) {
    super(scope, id, props);

    // dynamodb setup
    const gameTableDB = new dynamodb.Table(this, 'gameTable', {
      tableName: 'guezzr',
      partitionKey: { name: 'gameId', type: dynamodb.AttributeType.STRING },
      removalPolicy: cdk.RemovalPolicy.DESTROY
    });


    //Lambdas
    // Start Game
    const startGame = new lambda.Function(this, 'startGame', {
      runtime: lambda.Runtime.PYTHON_3_8,
      description: 'Kick of the game',
      handler: 'start_game.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambdas/')),
      environment:{
        GAME_TABLE: gameTableDB.tableName
      }
    })
    
    startGame.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:*'],
        resources: [gameTableDB.tableArn]
      })
    )

    // Handle Guess
    const handleGuess = new lambda.Function(this, 'handleGuess', {
      runtime: lambda.Runtime.PYTHON_3_8,
      description: 'Handle user input',
      handler: 'handle_guess.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, 'lambdas/')),
      environment:{
        GAME_TABLE: gameTableDB.tableName
      }
    })
    handleGuess.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['dynamodb:*'],
        resources: [gameTableDB.tableArn]
      })
    )

    // api
    const api = new apigateway.RestApi(this, 'guezzrApi', {
      proxy: false,
    });

    // Endpoint to start the game
    const gameStartEndpoint = api.root.addResource('gameStartEndpoint')
    gameStartEndpoint.addMethod('GET', new apigateway.LambdaIntegration(startGame, { proxy:true}))
    gameStartEndpoint.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS
    })

    // Endpoint to handle user guess
    const handleGuessEndpoint = api.root.addResource('handleGuessEndpoint')
    handleGuessEndpoint.addMethod('POST', new apigateway.LambdaIntegration(handleGuess, { proxy:true}))
    handleGuessEndpoint.addCorsPreflight({
      allowOrigins: apigateway.Cors.ALL_ORIGINS
    })
  }
}

module.exports = { GuezzrStack }
