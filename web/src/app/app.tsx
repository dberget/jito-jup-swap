import { Helmet } from 'react-helmet';
import { AppRoutes } from './app-routes';
import { ClusterProvider } from './cluster/cluster-data-access';
import { SolanaProvider } from './solana/solana-provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const client = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={client}>
      <Helmet>
        <script src="https://terminal.jup.ag/main-v2.js" />
      </Helmet>
      <ClusterProvider>
        <SolanaProvider>
          <AppRoutes />
          <div id="integrated-terminal" />
        </SolanaProvider>
      </ClusterProvider>
    </QueryClientProvider>
  );
}
