import { isDbConfigured } from './db';
import { readSetting } from './adminData';
import { DEFAULT_POLICIES, mergePolicies, type Policy, type PolicyKey } from '@/src/data/policies';

/**
 * Policies as last published from the admin website editor (Website > Policies), falling
 * back to the built-in text if nothing is published or the database can't be reached.
 */
export async function publishedPolicies(): Promise<Record<PolicyKey, Policy>> {
  if (!isDbConfigured()) return DEFAULT_POLICIES;
  try {
    const { value } = await readSetting('website_published');
    return mergePolicies((value as { policies?: Partial<Record<PolicyKey, Partial<Policy>>> } | null)?.policies);
  } catch (err) {
    console.error('[policies] could not read published policies:', err);
    return DEFAULT_POLICIES;
  }
}
