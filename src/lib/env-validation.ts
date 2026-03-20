interface EnvValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePaymentEnvironment(): EnvValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL is required');
  }
  if (!process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    errors.push('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required');
  }
  if (!process.env.SUPABASE_SECRET_KEY) {
    errors.push('SUPABASE_SECRET_KEY is required');
  }
  if (!process.env.NEXT_PUBLIC_APP_URL) {
    warnings.push('NEXT_PUBLIC_APP_URL is recommended for local auth callback and share links');
  }
  if (!process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN) {
    warnings.push('NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN missing - globe rendering will fail');
  }

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    !process.env.NEXT_PUBLIC_SUPABASE_URL.startsWith('https://')
  ) {
    errors.push('NEXT_PUBLIC_SUPABASE_URL must be a valid HTTPS URL');
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

export function logEnvironmentStatus(): void {
  void validatePaymentEnvironment();
}

if (process.env.NODE_ENV !== 'development') {
  validatePaymentEnvironment();
}
