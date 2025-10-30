import { useEffect } from 'react';

import { router } from '../routes/router';

const CommandPaletteView = () => {
  useEffect(() => {
    router.navigate({ to: '/' });
  }, []);

  return null;
};

export default CommandPaletteView;
