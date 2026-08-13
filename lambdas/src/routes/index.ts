import type { Express } from 'express';
import landPageRouter from './landing-page';

function useRoutes(server: Express): void {
  let route = '/';
  if (process.env.ENV !== 'local') {
    route = `/${process.env.ENV}`;
  }
  server.use(route, landPageRouter);
}
  
export default useRoutes;