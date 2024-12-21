import { useAccount, useConnect, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi';

export function Account() {
  const { address, connector, isConnected } = useAccount();
  const { connect, connectors, error, isIdle } = useConnect(); // Keep isLoading for the connection process
  const { disconnect } = useDisconnect();
  const { data: ensName } = useEnsName({ address });
  const { data: ensAvatar } = useEnsAvatar({ name: ensName });

  const formattedAddress = formatAddress(address);
  const ensNameString = ensName ?? ''; // Ensure it's a string or undefined

  if (isConnected) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          {ensAvatar ? (
            <img alt="ENS Avatar" className="w-8 h-8 rounded-full" src={ensAvatar} />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gray-200" />
          )}
          <div>
            {address && (
              <div className="text-sm font-medium text-gray-900">
                {ensNameString ? `${ensNameString} (${formattedAddress})` : formattedAddress}
              </div>
            )}
            <div className="text-xs text-gray-500">
              Connected to {connector?.name}
            </div>
          </div>
        </div>
        <button
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          onClick={() => disconnect()}
        >
          Disconnect
        </button>
      </div>
    );
  }

  return (
    <div>
      {connectors.map((connector) => (
        <button
          key={connector.id}
          className={`px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed ${
            isIdle && connector.id === connector.id ? 'opacity-50' : ''
          }`}
          disabled={!connector.ready}
          onClick={() => connect({ connector })}
        >
          {connector.name}
          {!connector.ready && ' (unsupported)'}
          {isIdle && connector.id === connector.id && ' (connecting)'}
        </button>
      ))}

      {error && <div className="text-red-500">{error.message}</div>}
    </div>
  );
}

function formatAddress(address?: string) {
  if (!address) return '';
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}
