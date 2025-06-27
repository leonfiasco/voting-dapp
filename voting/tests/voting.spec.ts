import * as anchor from '@coral-xyz/anchor'
import { Program } from '@coral-xyz/anchor'
import { Voting } from '../target/types/voting'
import { Keypair, PublicKey } from '@solana/web3.js'
import { startAnchor } from 'solana-bankrun'
import { BankrunProvider } from 'anchor-bankrun'
import { expect } from 'chai'

const IDL = require('../target/idl/voting.json')

const votingAddress = new PublicKey('GDa34CGC2H82X9iJjLNzzLdyMbmPGkKiLt9Ejzzffx6F')

describe('voting', () => {
  // Configure the client to use the local cluster.
  // anchor.setProvider(anchor.AnchorProvider.env())

  // const program = anchor.workspace.Voting as Program<Voting>

  let context
  let provider
  let votingProgram

  before(async () => {
    context = await startAnchor('', [{ name: 'voting', programId: votingAddress }], [])
    provider = new BankrunProvider(context)

    votingProgram = new Program<Voting>(IDL, provider)
  })

  it('Poll is initialised!', async () => {
    await votingProgram.methods
      .initializePoll(
        new anchor.BN(1),
        'What is your favourite type of peanut butter?',
        new anchor.BN(0),
        new anchor.BN(1950837224),
      )
      .rpc()

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8)],
      votingAddress,
    )

    const poll = await votingProgram.account.poll.fetch(pollAddress)

    console.log(poll)

    expect(poll.pollId.toNumber()).equal(1)

    expect(poll.description).equal('What is your favourite type of peanut butter?')
    expect(poll.pollStart.toNumber()).lessThan(poll.pollEnd.toNumber())
  })

  it('initialise candidate ', async () => {
    await votingProgram.methods.initializeCandidate('Smooth', new anchor.BN(1)).rpc()
    await votingProgram.methods.initializeCandidate('Crunchy', new anchor.BN(1)).rpc()

    const [crunchyAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Crunchy')],
      votingAddress,
    )

    const crunchyCandidate = await votingProgram.account.candidate.fetch(crunchyAddress)

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Smooth')],
      votingAddress,
    )

    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress)

    console.log('Before', crunchyCandidate)

    expect(crunchyCandidate.candidateVotes.toNumber()).to.equal(0)
    expect(smoothCandidate.candidateVotes.toNumber()).to.equal(0)
    console.log('Before', smoothCandidate)
  })

  it('vote ', async () => {
    await votingProgram.methods.vote('Smooth', new anchor.BN(1)).rpc()

    const [smoothAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, 'le', 8), Buffer.from('Smooth')],
      votingAddress,
    )

    const smoothCandidate = await votingProgram.account.candidate.fetch(smoothAddress)

    console.log('After', smoothCandidate)

    expect(smoothCandidate.candidateVotes.toNumber()).to.equal(1)
  })
})
