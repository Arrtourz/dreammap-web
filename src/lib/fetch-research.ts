/**
 * Server-side helper to fetch completed research from Valyu DeepResearch API
 */

const DEEPRESEARCH_API_URL = 'https://api.valyu.ai/v1/deepresearch';
const DEEPRESEARCH_API_KEY = process.env.VALYU_API_KEY;

export interface ResearchContent {
  output?: string;
  messages?: any[];
  sources?: any[];
  status: string;
}

/**
 * Fetch completed research content from Valyu API
 * Returns null if research is not completed or fails
 */
export async function fetchCompletedResearch(taskId: string): Promise<ResearchContent | null> {
  if (!DEEPRESEARCH_API_KEY) {
    return null;
  }

  try {
    const response = await fetch(
      `${DEEPRESEARCH_API_URL}/tasks/${taskId}/status`,
      {
        method: 'GET',
        headers: {
          'X-API-Key': DEEPRESEARCH_API_KEY,
        },
        cache: 'no-store',
      }
    );

    if (!response.ok) {
      return null;
    }

    const data = await response.json();

    if (data.status !== 'completed') {
      return null;
    }

    return data;
  } catch (error) {
    return null;
  }
}
