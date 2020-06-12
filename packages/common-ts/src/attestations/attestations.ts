import { utils, ethers } from 'ethers'
import * as eip712 from './eip712'

const RECEIPT_TYPE_HASH = eip712.typeHash(
  'Receipt(bytes32 requestCID,bytes32 responseCID,bytes32 subgraphDeploymentID)',
)

export interface Receipt {
  requestCID: string
  responseCID: string
  subgraphDeploymentID: string
}

const SALT = '0xa070ffb1cd7409649bf77822cce74495468e06dbfaef09556838bf188679b9c2'

const encodeReceipt = (receipt: Receipt): string =>
  eip712.hashStruct(
    RECEIPT_TYPE_HASH,
    ['bytes32', 'bytes32', 'bytes32'],
    [receipt.requestCID, receipt.responseCID, receipt.subgraphDeploymentID],
  )

export interface Attestation {
  requestCID: string
  responseCID: string
  subgraphDeploymentID: string
  v: number
  r: string
  s: string
}

export const createAttestation = async (
  signer: utils.BytesLike,
  chainId: number,
  disputeManagerAddress: string,
  receipt: Receipt,
): Promise<Attestation> => {
  let domainSeparator = eip712.domainSeparator({
    name: 'Graph Protocol',
    version: '0',
    chainId,
    verifyingContract: disputeManagerAddress,
    salt: SALT,
  })
  let encodedReceipt = encodeReceipt(receipt)
  let message = eip712.encode(domainSeparator, encodedReceipt)
  let messageHash = utils.keccak256(message)
  let signingKey = new utils.SigningKey(signer)
  let { r, s, v } = signingKey.signDigest(messageHash)

  return {
    requestCID: receipt.requestCID,
    responseCID: receipt.responseCID,
    subgraphDeploymentID: receipt.subgraphDeploymentID,
    v: v!,
    r,
    s,
  }
}
