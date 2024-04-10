import axios from 'axios';
import bs58 from 'bs58';

export async function sendTransactionJito(
  serializedTransaction: Uint8Array | number[]
) {
  const encodedTx = bs58.encode(serializedTransaction);
  const jitoURL = 'https://mainnet.block-engine.jito.wtf/api/v1/transactions';
  const payload = {
    jsonrpc: '2.0',
    id: 1,
    method: 'sendTransaction',
    params: [encodedTx],
  };

  try {
    const response = await axios.post(jitoURL, payload, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data.result;
  } catch (error) {
    console.error('Error:', error);
    throw new Error('cannot send!');
  }
}

// export async function sendTransactionJito(
//   serializedTransaction: Uint8Array | number[],
//   user: string,
//   blockhash: string
// ) {
//   const jitoURL = 'https://api.lenderlabs.xyz/api/bundle';
//   const payload = {
//     flashAmount: 0,
//     borrower: user,
//     blockhash: blockhash,
//     txs: [serializedTransaction],
//   };

//   try {
//     const response = await axios.post(jitoURL, payload, {
//       headers: { 'Content-Type': 'application/json' },
//     });
//     return response.data.result;
//   } catch (error) {
//     console.error('Error:', error);
//     throw new Error('cannot send!');
//   }
// }
