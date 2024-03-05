import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import { Settings, Prompt, defaultSettings, GameStage, UserNameUpdate, ImageSelectUpdate } from './interface'
import OpenAI from 'openai'
import 'dotenv/config'
import { writeFileSync } from 'fs'
import cors from 'cors'
import path from 'path'

const PORT = 3000
const IMAGE_COUNT = parseInt( process.env.IMAGE_COUNT || '2' )
// eslint-disable-next-line max-len
const errorImage = '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'
if ( !process.env.OPENAI_API_KEY ) throw new Error( 'Could not find OpenAI API key.' )
const openai = new OpenAI( { apiKey: process.env.OPENAI_API_KEY } )
const CORS_OPTIONS = { origin: 'http://localhost:5173' }
let images: {[user: string]: string[]} = {}

let settings: Settings = defaultSettings

const app = express()
const httpServer = createServer( app )
const io = new Server( httpServer, { cors: CORS_OPTIONS } )

io.on( 'connection', ( client ) => {
  client.emit( 'settings', settings )

  const updateClients = async (): Promise<void> => {
    console.log( 'pushing settings:', JSON.stringify( settings ) )
    io.emit( 'settings', settings )
  }

  client.on( 'reset', () => {
    console.log( '==== resetting' )
    settings = structuredClone( defaultSettings )
    updateClients()
  } )

  client.on( 'update-username', ( e: UserNameUpdate ) => {
    delete settings.users[e.old]
    settings.users[e.new] = ''
    updateClients()
  } )

  client.on( 'start-timer', ( duration: number ) => {
    console.log( 'starting timer' )
    const d = new Date()
    d.setSeconds( d.getSeconds() + duration )
    settings.timerEnd = d
    settings.stage = GameStage.EnteringPrompts
    updateClients()
  } )

  client.on( 'update-prompt', ( e: Prompt ) => {
    console.log( 'received prompt:', e )
    settings.users[e.user] = e.prompt
    updateClients()
  } )

  client.on( 'remove-player', ( e: string ) => {
    console.log( 'Removed player:', e )
    delete settings.users[e]
    updateClients()
  } )

  client.on( 'update-challenge', ( e: string ) => {
    console.log( 'Updated challenge:', e )
    settings.challenge = e
    updateClients()
  } )

  client.on( 'update-stage', ( e: GameStage ) => {
    console.log( 'Updated stage:', GameStage[e] )
    settings.stage = e
    updateClients()
  } )

  client.on( 'generate-images', async () => {
    settings.stage = GameStage.GeneratingImages
    updateClients()
    const promises = Array( 1 )
      .fill( Object.entries( settings.users ) )
      .flat()
      .map( async ( [ userName, prompt ] ) =>
        generateImage( prompt )
          .then( image => ( { image, userName } ) )
          .catch( ( e ) => {
            if ( e?.error?.message ) console.log( `==== ERROR: ${userName} — ${e.error.message}` )
            return Promise.reject( { userName } )
          } )
      )

    const results = await Promise.allSettled( promises )
    images = results
      .map( e => e.status === 'fulfilled' ? e.value : ( { image: [ errorImage ], userName: e.reason.userName } ) )
      .reduce( ( acc, cur ) => Object.assign( acc, { [cur.userName]: cur.image } ), {} )
    settings.imageSelections = {}
    settings.stage = GameStage.SelectingImage
    updateClients()
  } )

  client.on( 'select-image', ( { userName, index }: ImageSelectUpdate ) => {
    console.log( 'Selected Image:', userName, index )
    settings.imageSelections[userName] = index
    updateClients()
  } )
} )

app.use( express.static( './dist' ) )
app.get( '/images/:user', cors( CORS_OPTIONS ), ( req, res ) => {
  const { user } = req.params
  const toSend = images[user]
  res.json( toSend )
} )

app.get( '*', ( _, res ) => {
  res.sendFile( path.resolve( path.dirname( '.' ), 'dist', 'index.html' ) )
} )

httpServer.listen( PORT, () => console.log( `> Listening on port ${PORT}` ) )

export const generateImage = async ( prompt: string ): Promise<string[]> => {
  console.log( `Generating images for prompt "${prompt}"` )
  const apiResponse = await openai.images.generate( {
    prompt: prompt,
    n: IMAGE_COUNT,
    size: '1024x1024',
    response_format: 'b64_json',
    model: 'dall-e-2'
  } )
  writeFileSync( `./images/${prompt}`, JSON.stringify( apiResponse ) )
  // await new Promise( f => setTimeout( f, 5000 ) )
  // const apiResponse = JSON.parse( readFileSync( `./images/${prompt}`, 'utf8' ) )
  // const res: ( string|undefined )[] = apiResponse.data.map( ( e: {b64_json: string|undefined} ) => e.b64_json )
  const res: ( string|undefined )[] = apiResponse.data.map( e => e.b64_json )
  console.log( `Done with generating images for prompt "${prompt}"` )
  if ( res.some( e => e === undefined ) )
    throw new Error( 'Received invalid response' )
  else
    return res as string[]
}