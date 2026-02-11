import { Request, Response, NextFunction } from 'express';

export const apiKeyAuth = (req: Request, res: Response, next: NextFunction): void => {
  const apiKey = req.headers['x-api-key'];
  const expectedApiKey = process.env.API_KEY;

  if (!apiKey) {
    res.status(401).json({
      errors: [{
        status: '401',
        title: 'Unauthorized',
        detail: 'API key is missing'
      }]
    });
    return;
  }

  if (apiKey !== expectedApiKey) {
    res.status(401).json({
      errors: [{
        status: '401',
        title: 'Unauthorized',
        detail: 'Invalid API key'
      }]
    });
    return;
  }

  next();
};
