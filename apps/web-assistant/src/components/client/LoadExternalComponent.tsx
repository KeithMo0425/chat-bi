import { LoadExternalComponent as LGLoadExternalComponent, UIMessage } from '@langchain/langgraph-sdk/react-ui';
import { useStreamContext } from '@/providers/Stream';
import clientComponents from './components';


export function LoadExternalComponent({ ui }: { ui: UIMessage }) {
  const stream = useStreamContext();
  return (
    <LGLoadExternalComponent
      stream={stream}
      message={ui}
      components={clientComponents}
      fallback={<div>Loading UI Component...</div>}
    />
  )
}