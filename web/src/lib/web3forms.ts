interface Web3FormsResponse {
  success: boolean;
  message?: string;
}

interface SendNotificationInput {
  subject: string;
  email: string;
  name: string;
  message: string;
  [key: string]: string;
}

const WEB3FORMS_ENDPOINT =
  'https://api.web3forms.com/submit';

export async function sendEmailNotification(
  input: SendNotificationInput,
): Promise<Web3FormsResponse> {
  const accessKey = import.meta.env
    .VITE_WEB3FORMS_ACCESS_KEY?.trim();

  if (!accessKey) {
    console.error(
      'Web3Forms configuration missing. Check web/.env and restart Vite.',
    );

    throw new Error(
      'Email notification service is not configured.',
    );
  }

  const formData = new FormData();

  formData.append('access_key', accessKey);
  formData.append('subject', input.subject);
  formData.append('from_name', 'AGN 2027');
  formData.append('email', input.email);
  formData.append('name', input.name);
  formData.append('message', input.message);

  Object.entries(input).forEach(([key, value]) => {
    if (
      ![
        'subject',
        'email',
        'name',
        'message',
      ].includes(key)
    ) {
      formData.append(key, value);
    }
  });

  const response = await fetch(WEB3FORMS_ENDPOINT, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
    },
    body: formData,
  });

  const result = await response.json() as Web3FormsResponse;

  if (!response.ok || !result.success) {
    console.error('Web3Forms delivery error:', result.message);

    throw new Error(
      result.message || 'Unable to deliver notification email.',
    );
  }

  return result;
}