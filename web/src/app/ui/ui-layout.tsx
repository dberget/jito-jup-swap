/* eslint-disable @typescript-eslint/no-explicit-any */
import { WalletButton } from '../solana/solana-provider';
import * as React from 'react';
import { ReactNode, Suspense, useEffect, useRef } from 'react';

import { Link, useLocation } from 'react-router-dom';

import { ExplorerLink } from '../cluster/cluster-ui';
import toast, { Toaster } from 'react-hot-toast';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { sendTransactionJito } from '../swap/swap-data';
import {
  TransactionInstruction,
  PublicKey,
  AddressLookupTableAccount,
  TransactionMessage,
  SystemProgram,
  VersionedTransaction,
  PublicKeyInitData,
} from '@solana/web3.js';

export function UiLayout({
  children,
  links,
}: {
  children: ReactNode;
  links: { label: string; path: string }[];
}) {
  const [tipAmount, setTipAmount] = React.useState(0.0001);
  const { publicKey: walletPublicKey } = useWallet();
  const { pathname } = useLocation();
  const passthroughWalletContextState = useWallet();
  const { connection } = useConnection();

  const onRequestIxCallback: any = async (ixAndCb: {
    meta: any;
    instructions: any;
    onSubmitWithIx: any;
  }) => {
    const { meta, instructions, onSubmitWithIx } = ixAndCb;

    if (
      !walletPublicKey ||
      !passthroughWalletContextState.wallet ||
      !passthroughWalletContextState ||
      !passthroughWalletContextState.signTransaction
    )
      return;

    const {
      setupInstructions, // Setup missing ATA for the users.
      swapInstruction: swapInstructionPayload, // The actual swap instruction.
      cleanupInstruction, // Unwrap the SOL if `wrapAndUnwrapSol = true`.
      addressLookupTableAddresses, // The lookup table addresses that you can use if you are using versioned transaction.
    } = instructions;

    const deserializeInstruction = (
      instruction: (typeof instructions)['swapInstruction']
    ) => {
      return new TransactionInstruction({
        programId: new PublicKey(instruction.programId),
        keys: instruction.accounts.map(
          (key: {
            pubkey: PublicKeyInitData;
            isSigner: any;
            isWritable: any;
          }) => ({
            pubkey: new PublicKey(key.pubkey),
            isSigner: key.isSigner,
            isWritable: key.isWritable,
          })
        ),
        data: Buffer.from(instruction.data, 'base64'),
      });
    };

    const getAddressLookupTableAccounts = async (
      keys: string[]
    ): Promise<AddressLookupTableAccount[]> => {
      const addressLookupTableAccountInfos =
        await connection.getMultipleAccountsInfo(
          keys.map((key) => new PublicKey(key))
        );

      return addressLookupTableAccountInfos.reduce(
        (acc, accountInfo, index) => {
          const addressLookupTableAddress = keys[index];
          if (accountInfo) {
            const addressLookupTableAccount = new AddressLookupTableAccount({
              key: new PublicKey(addressLookupTableAddress),
              state: AddressLookupTableAccount.deserialize(accountInfo.data),
            });
            acc.push(addressLookupTableAccount);
          }

          return acc;
        },
        new Array<AddressLookupTableAccount>()
      );
    };

    const addressLookupTableAccounts: AddressLookupTableAccount[] = [];
    addressLookupTableAccounts.push(
      ...(await getAddressLookupTableAccounts(addressLookupTableAddresses))
    );

    const tipIx = SystemProgram.transfer({
      fromPubkey: walletPublicKey,
      toPubkey: new PublicKey(
        'DttWaMuVvTiduZRnguLF7jNxTgiMBZ1hyAumKUiL2KRL' // Jito tip account
      ),
      lamports: tipAmount * 10 ** 9, // tip
    });

    const { blockhash } = await connection.getLatestBlockhash();
    const messageV0 = new TransactionMessage({
      payerKey: new PublicKey(walletPublicKey),
      recentBlockhash: blockhash,
      instructions: [
        ...setupInstructions.map(deserializeInstruction),
        deserializeInstruction(swapInstructionPayload),
        cleanupInstruction ? deserializeInstruction(cleanupInstruction) : null,
        tipIx,
      ].filter(Boolean) as TransactionInstruction[],
    }).compileToV0Message(addressLookupTableAccounts);

    const transaction = new VersionedTransaction(messageV0);

    const signedTx = await passthroughWalletContextState.signTransaction(
      transaction
    );

    const res = await sendTransactionJito(signedTx.serialize());

    console.log(res);

    onSubmitWithIx({ txId: res });
  };

  React.useEffect(() => {
    // @ts-expect-error stuff
    window?.Jupiter?.init({
      onRequestIxCallback,
      strictTokenList: false,
      displayMode: 'integrated',
      integratedTargetId: 'integrated-terminal',
      endpoint:
        'https://mainnet.helius-rpc.com/?api-key=87f15176-5b11-42e2-92a3-4332752769a4',
    });

    // @ts-expect-error stuff
    window?.Jupiter?.syncProps &&
      // @ts-expect-error stuff
      window?.Jupiter?.syncProps({ passthroughWalletContextState });
  }, [passthroughWalletContextState]);

  return (
    <div className="h-full flex flex-col">
      <div className="navbar bg-base-300 flex-col md:flex-row space-y-2 md:space-y-0">
        <div className="flex-1">
          <Link className="btn btn-ghost normal-case text-xl" to="/">
            <h4 className="h-4 md:h-6 m-0">Bundle Swap</h4>
          </Link>
          <ul className="menu menu-horizontal px-1 space-x-2">
            {links.map(({ label, path }) => (
              <li key={path}>
                <Link
                  className={pathname.startsWith(path) ? 'active' : ''}
                  to={path}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div className="flex flex-col mr-2">
          <label>Tip (SOL)</label>

          <input
            type="number"
            value={tipAmount}
            min={0.000001}
            step={0.0001}
            onChange={(e) => setTipAmount(parseFloat(e.currentTarget.value))}
          />
        </div>
        <div className="flex-none space-x-2">
          <WalletButton />
        </div>
      </div>
      <div className="flex-grow mx-4 lg:mx-auto">
        <div id="integrated-terminal"></div>
        <Suspense
          fallback={
            <div className="text-center my-32">
              <span className="loading loading-spinner loading-lg"></span>
            </div>
          }
        >
          {children}
        </Suspense>
        <Toaster position="bottom-right" />
      </div>
      <footer className="footer footer-center p-4 bg-base-300 text-base-content">
        <div className="flex no-wrap">
          <div className="flex no-wrap">
            Powered By{' '}
            <img
              className="ml-1 w-12"
              src="https://www.jito.wtf/logos/jitoLabs.svg"
            />
          </div>
          |
          <a
            className="text-white"
            href="https://github.com/dberget/jito-jup-swap"
          >
            Github
          </a>
        </div>
      </footer>
    </div>
  );
}

export function AppModal({
  children,
  title,
  hide,
  show,
  submit,
  submitDisabled,
  submitLabel,
}: {
  children: ReactNode;
  title: string;
  hide: () => void;
  show: boolean;
  submit?: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);

  useEffect(() => {
    if (!dialogRef.current) return;
    if (show) {
      dialogRef.current.showModal();
    } else {
      dialogRef.current.close();
    }
  }, [show, dialogRef]);

  return (
    <dialog className="modal" ref={dialogRef}>
      <div className="modal-box space-y-5">
        <h3 className="font-bold text-lg">{title}</h3>
        {children}
        <div className="modal-action">
          <div className="join space-x-2">
            {submit ? (
              <button
                className="btn btn-xs lg:btn-md btn-primary"
                onClick={submit}
                disabled={submitDisabled}
              >
                {submitLabel || 'Save'}
              </button>
            ) : null}
            <button onClick={hide} className="btn">
              Close
            </button>
          </div>
        </div>
      </div>
    </dialog>
  );
}

export function AppHero({
  children,
  title,
  subtitle,
}: {
  children?: ReactNode;
  title: ReactNode;
  subtitle: ReactNode;
}) {
  return (
    <div className="hero py-[64px]">
      <div className="hero-content text-center">
        <div className="max-w-2xl">
          {typeof title === 'string' ? (
            <h1 className="text-5xl font-bold">{title}</h1>
          ) : (
            title
          )}
          {typeof subtitle === 'string' ? (
            <p className="py-6">{subtitle}</p>
          ) : (
            subtitle
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

export function ellipsify(str = '', len = 4) {
  if (str.length > 30) {
    return (
      str.substring(0, len) + '..' + str.substring(str.length - len, str.length)
    );
  }
  return str;
}

export function useTransactionToast() {
  return (signature: string) => {
    toast.success(
      <div className={'text-center'}>
        <div className="text-lg">Transaction sent</div>
        <ExplorerLink
          path={`tx/${signature}`}
          label={'View Transaction'}
          className="btn btn-xs btn-primary"
        />
      </div>
    );
  };
}
