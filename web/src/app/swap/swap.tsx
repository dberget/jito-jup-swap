/* eslint-disable react-hooks/exhaustive-deps */
import { useWallet } from '@solana/wallet-adapter-react';
import { useEffect } from 'react';

export default function Swap() {
  const passthroughWalletContextState = useWallet();

  useEffect(() => {
    // @ts-expect-error stuff
    if (!window.Jupiter.syncProps) return;
    // @ts-expect-error stuff
    window.Jupiter.syncProps({ passthroughWalletContextState });
  }, [passthroughWalletContextState.connected]);

  return <div>Swap</div>;
}
