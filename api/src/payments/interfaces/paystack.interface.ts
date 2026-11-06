export interface PaystackInitializeResponse {
  status: boolean;
  message: string;

  data: {
    authorization_url: string;
    access_code: string;
    reference: string;
  };
}

export interface PaystackVerifyResponse {
  status: boolean;
  message: string;

  data: {
    id: number;
    status: string;
    reference: string;
    amount: number;
    currency: string;
    paid_at: string | null;
    gateway_response?: string;

    customer?: {
      email?: string;
    };
  };
}

export interface PaystackWebhookEvent {
  event: string;

  data: {
    reference?: string;
  };
}

export interface PaystackPaymentMetadata {
  paymentReference: string;
  enquiryId: string | null;
  commitmentId: string | null;
  eventId: string;
  purpose: string;
}