import { supabase } from './supabaseClient';
import { Transaction } from '../types';

export const transactionService = {
  // 1. Fetch all transactions
  fetchAll: async (): Promise<Transaction[]> => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (data || []).map((item: any) => ({
      id: item.id,
      date: item.date,
      amount: Number(item.amount),
      type: item.type,
      category: item.category,
      description: item.description,
      contributor: item.contributor
    }));
  },

  // 2. Add a new transaction
  create: async (transaction: Transaction): Promise<void> => {
    // Remove undefined fields to avoid Supabase errors if column allows null
    const payload = {
      id: transaction.id,
      date: transaction.date,
      amount: transaction.amount,
      type: transaction.type,
      category: transaction.category,
      description: transaction.description,
      contributor: transaction.contributor || null // Send null explicitly if empty
    };

    const { error } = await supabase
      .from('transactions')
      .insert([payload]);

    if (error) throw error;
  },

  // 3. Delete a transaction
  delete: async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // 4. Update a transaction
  update: async (transaction: Transaction): Promise<void> => {
    const payload = {
        date: transaction.date,
        amount: transaction.amount,
        type: transaction.type,
        category: transaction.category,
        description: transaction.description,
        contributor: transaction.contributor || null
    };

    const { error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', transaction.id);

    if (error) throw error;
  }
};