import { ActionGetResponse, ActionPostRequest, ACTIONS_CORS_HEADERS, createPostResponse } from '@solana/actions'
import { Connection, PublicKey, Transaction } from '@solana/web3.js'
import { Voting } from '../../../../voting/target/types/voting'
import { BN, Program } from '@coral-xyz/anchor'

import IDL from '../../../../voting/target/idl/voting.json'

export const options = GET

export async function GET() {
  const actionMetdata: ActionGetResponse = {
    icon: 'https://zestfulkitchen.com/wp-content/uploads/2021/09/Peanut-butter_hero_for-web-2.jpg',
    title: 'Vote for your favorite type of peanut butter! 🥜',
    description: 'Vote between crunchy and smooth peanut butter. 🥜',
    label: 'Vote',
    links: {
      actions: [
        {
          label: 'Vote for Crunchy',
          href: '/api/vote?candidate=Crunchy',
          type: 'transaction',
        },
        {
          label: 'Vote for Smooth',
          href: '/api/vote?candidate=Smooth',
          type: 'transaction',
        },
      ],
    },
  }
  return Response.json(actionMetdata, { headers: ACTIONS_CORS_HEADERS })
}

export async function POST(request: Request) {
  const url = new URL(request.url)
  const candidate = url.searchParams.get('candidate')

  if (candidate != 'Crunchy' && candidate != 'Smooth') {
    return new Response('Invalid candidate', { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const connection = new Connection('http://127.0.0.1:8899', 'confirmed')
  const program: Program<Voting> = new Program(IDL, { connection })

  const body: ActionPostRequest = await request.json()
  let voter

  try {
    voter = new PublicKey(body.account)
  } catch (error) {
    const err = error
    console.log(err)

    return new Response('Invalid account', { status: 400, headers: ACTIONS_CORS_HEADERS })
  }

  const instruction = await program.methods
    .vote(candidate, new BN(1))
    .accounts({
      signer: voter,
    })
    .instruction()

  const blockhash = await connection.getLatestBlockhash()

  const transaction = new Transaction({
    feePayer: voter,
    blockhash: blockhash.blockhash,
    lastValidBlockHeight: blockhash.lastValidBlockHeight,
  }).add(instruction)

  const response = await createPostResponse({
    fields: {
      transaction: transaction, // Your Transaction object
      type: 'transaction', // Lowercase
      // Include other required fields from TransactionResponse if needed
    },
  })

  return Response.json(response, { headers: ACTIONS_CORS_HEADERS })
}
