export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      users_table: {
        Row: {
          id: number;
          supabase_auth_id: string;
          name: string;
          age: number;
          email: string;
        };
        Insert: {
          id?: number;
          supabase_auth_id: string;
          name: string;
          age: number;
          email: string;
        };
        Update: {
          id?: number;
          supabase_auth_id?: string;
          name?: string;
          age?: number;
          email?: string;
        };
      };
    };
  };
}
