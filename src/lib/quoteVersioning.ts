/**
 * Quote Versioning & Revision Management
 * Handles creation and tracking of quote revisions
 */

import { supabase } from './supabase';
import type { Quote, CreateRevisionResult } from './types/quotes';

/**
 * Create a new revision of an existing quote
 * @param parentQuoteId The ID of the quote to revise
 * @param userId The admin user creating the revision
 * @returns The new quote ID and number
 */
export async function createQuoteRevision(
  parentQuoteId: string,
  userId: string
): Promise<CreateRevisionResult> {
  try {
    const { data, error } = await supabase.rpc('create_quote_revision', {
      p_parent_quote_id: parentQuoteId,
      p_user_id: userId,
    });

    if (error) throw error;

    // Fetch the new quote to get its number
    const { data: newQuote, error: fetchError } = await supabase
      .from('quotes')
      .select('quote_number')
      .eq('id', data)
      .single();

    if (fetchError) throw fetchError;

    return {
      success: true,
      new_quote_id: data,
      new_quote_number: newQuote.quote_number,
    };
  } catch (error) {
    console.error('Error creating quote revision:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create revision',
    };
  }
}

/**
 * Get all versions of a quote (revision history)
 * @param quoteId Any quote ID in the version chain
 * @returns Array of all versions, ordered by version_number
 */
export async function getQuoteVersionHistory(
  quoteId: string
): Promise<{ success: boolean; versions?: Quote[]; error?: string }> {
  try {
    // First, find the root quote (original version)
    const { data: currentQuote, error: currentError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (currentError) throw currentError;

    let rootQuoteId = quoteId;
    
    // If this quote has a parent, traverse up to find the root
    if (currentQuote.parent_quote_id) {
      let parentId = currentQuote.parent_quote_id;
      
      while (parentId) {
        const { data: parentQuote, error: parentError } = await supabase
          .from('quotes')
          .select('id, parent_quote_id')
          .eq('id', parentId)
          .single();

        if (parentError) throw parentError;

        rootQuoteId = parentId;
        parentId = parentQuote.parent_quote_id;
      }
    }

    // Now get all versions that stem from this root
    const { data: allVersions, error: versionsError } = await supabase
      .from('quotes')
      .select('*')
      .or(`id.eq.${rootQuoteId},parent_quote_id.eq.${rootQuoteId}`)
      .order('version_number', { ascending: true });

    if (versionsError) throw versionsError;

    // Recursively get all child versions
    const getAllDescendants = async (versions: Quote[]): Promise<Quote[]> => {
      const childQueries = versions.map(async (version) => {
        const { data: children } = await supabase
          .from('quotes')
          .select('*')
          .eq('parent_quote_id', version.id);
        
        return children || [];
      });

      const childArrays = await Promise.all(childQueries);
      const allChildren = childArrays.flat();

      if (allChildren.length === 0) {
        return versions;
      }

      return [...versions, ...await getAllDescendants(allChildren)];
    };

    const completeHistory = await getAllDescendants(allVersions || []);
    
    // Sort by version number
    const sortedHistory = completeHistory.sort((a, b) => a.version_number - b.version_number);

    return { success: true, versions: sortedHistory };
  } catch (error) {
    console.error('Error fetching version history:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch version history',
    };
  }
}

/**
 * Get the current (active) version of a quote
 * @param quoteId Any quote ID in the version chain
 * @returns The current version
 */
export async function getCurrentQuoteVersion(
  quoteId: string
): Promise<{ success: boolean; quote?: Quote; error?: string }> {
  try {
    const { versions } = await getQuoteVersionHistory(quoteId);
    
    if (!versions || versions.length === 0) {
      throw new Error('No versions found');
    }

    // Find the current version
    const currentVersion = versions.find(v => v.is_current_version);

    if (!currentVersion) {
      throw new Error('No current version found');
    }

    return { success: true, quote: currentVersion };
  } catch (error) {
    console.error('Error getting current version:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get current version',
    };
  }
}

/**
 * Mark a quote as superseded and create a revision
 * This is a higher-level function that handles the workflow
 * @param quoteId The quote to supersede
 * @param userId The admin user
 * @returns The new revision
 */
export async function supersede AndCreateRevision(
  quoteId: string,
  userId: string
): Promise<CreateRevisionResult> {
  try {
    // Verify quote exists and is current
    const { data: quote, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', quoteId)
      .single();

    if (fetchError) throw fetchError;

    if (!quote.is_current_version) {
      throw new Error('Cannot revise a superseded quote. Please revise the current version instead.');
    }

    // Create revision
    return await createQuoteRevision(quoteId, userId);
  } catch (error) {
    console.error('Error in supersede and create revision:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create revision',
    };
  }
}

/**
 * Get version comparison data
 * Useful for showing "what changed" between versions
 * @param oldVersionId The older version ID
 * @param newVersionId The newer version ID
 */
export async function compareQuoteVersions(
  oldVersionId: string,
  newVersionId: string
): Promise<{
  success: boolean;
  differences?: {
    field: string;
    oldValue: any;
    newValue: any;
  }[];
  error?: string;
}> {
  try {
    const { data: versions, error } = await supabase
      .from('quotes')
      .select('*')
      .in('id', [oldVersionId, newVersionId]);

    if (error) throw error;

    if (!versions || versions.length !== 2) {
      throw new Error('Could not fetch both versions');
    }

    const oldVersion = versions.find(v => v.id === oldVersionId);
    const newVersion = versions.find(v => v.id === newVersionId);

    if (!oldVersion || !newVersion) {
      throw new Error('Version mismatch');
    }

    // Fields to compare
    const fieldsToCompare = [
      'title',
      'description',
      'service_type',
      'items',
      'subtotal',
      'tax_rate',
      'total_amount',
      'valid_until',
      'notes',
      'terms',
    ];

    const differences: { field: string; oldValue: any; newValue: any }[] = [];

    for (const field of fieldsToCompare) {
      const oldVal = oldVersion[field as keyof Quote];
      const newVal = newVersion[field as keyof Quote];

      // Deep comparison for objects/arrays
      if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
        differences.push({
          field,
          oldValue: oldVal,
          newValue: newVal,
        });
      }
    }

    return { success: true, differences };
  } catch (error) {
    console.error('Error comparing versions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare versions',
    };
  }
}

/**
 * Check if a quote can be revised
 * @param quoteId The quote ID
 * @returns Boolean and reason if not allowed
 */
export async function canReviseQuote(
  quoteId: string
): Promise<{ allowed: boolean; reason?: string }> {
  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select('status, is_current_version')
      .eq('id', quoteId)
      .single();

    if (error) throw error;

    if (!quote.is_current_version) {
      return {
        allowed: false,
        reason: 'This is an old version. Please revise the current version instead.',
      };
    }

    if (quote.status === 'draft') {
      return {
        allowed: false,
        reason: 'This quote is still a draft. Edit it directly instead of creating a revision.',
      };
    }

    if (quote.status === 'accepted') {
      return {
        allowed: false,
        reason: 'This quote has been accepted. Creating a revision may confuse the client.',
      };
    }

    return { allowed: true };
  } catch (error) {
    console.error('Error checking revision eligibility:', error);
    return {
      allowed: false,
      reason: 'Could not verify quote status',
    };
  }
}
