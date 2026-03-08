// Leads Context with Firebase firebase_uid + Supabase + Socket sync + Firebase token auth
// ─────────────────────────────────────────────

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import PropTypes from 'prop-types';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';
import { toast } from 'react-hot-toast';
import supabase, { setSupabaseAuth } from '@/lib/supabaseClient';

const LeadContext = createContext(null);

export const useLeads = () => {
  const context = useContext(LeadContext);
  if (!context) throw new Error('useLeads must be used within a LeadProvider');
  return context;
};

// ── Helper: Get Supabase user ID from Firebase firebase_uid ──
const getSupabaseUserId = async (firebaseUid) => {
  if (!firebaseUid) return null;
  
  try {
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('firebase_uid', firebaseUid)
      .single();
      
    if (error) throw error;
    return profile?.id || null;
  } catch (error) {
    console.error('Error fetching Supabase user ID:', error);
    return null;
  }
};

export const LeadProvider = ({ children }) => {
  const { user } = useAuth();
  const { socket } = useSocket() || {};

  const [leads, setLeadsState] = useState([]);
  const [loading, setLoading] = useState(true);
  const leadsRef = useRef([]);
  useEffect(() => {
    leadsRef.current = leads;
  }, [leads]);

  // ── Fetch Leads ──
  const fetchLeads = useCallback(async () => {
    if (!user?.firebase_uid) return;
    setLoading(true);
    try {
      await setSupabaseAuth(user);
      const userId = await getSupabaseUserId(user.firebase_uid);
      if (!userId) {
        throw new Error('User profile not found in Supabase');
      }
      
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .eq('firebase_uid', userId)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setLeadsState(data || []);
    } catch (e) {
      console.error('Error fetching leads:', e);
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchLeads();
  }, [user, fetchLeads]);

  // ── Add Lead ──
  const addLead = useCallback(
    async (leadData) => {
      if (!user?.firebase_uid || !leadData) return null;
      
      try {
        await setSupabaseAuth(user);
        const userId = await getSupabaseUserId(user.firebase_uid);
        if (!userId) {
          throw new Error('User profile not found in Supabase');
        }

        const { data, error } = await supabase
          .from('leads')
          .insert([{ ...leadData, firebase_uid: userId }])
          .select()
          .single();
          
        if (error) throw error;

        setLeadsState((prev) => (prev.some((l) => l.id === data.id) ? prev : [...prev, data]));
        if (socket) socket.emit('lead_created', data);
        toast.success('Lead added');
        return data;
      } catch (e) {
        console.error('Error adding lead:', e);
        toast.error(e.message || 'Failed to add lead');
        return null;
      }
    },
    [socket, user]
  );

  // ── Update Lead ──
  const updateLead = useCallback(
    async (updatedLead) => {
      if (!user?.firebase_uid || !updatedLead?.id) return null;
      
      try {
        await setSupabaseAuth(user);
        const userId = await getSupabaseUserId(user.firebase_uid);
        if (!userId) {
          throw new Error('User profile not found in Supabase');
        }

        // Ensure we only update the user's own leads
        const { data, error } = await supabase
          .from('leads')
          .update(updatedLead)
          .eq('id', updatedLead.id)
          .eq('firebase_uid', userId)
          .select()
          .single();
          
        if (error) throw error;

        setLeadsState((prev) => prev.map((l) => (l.id === data.id ? data : l)));
        if (socket) socket.emit('lead_updated', data);
        toast.success('Lead updated');
        return data;
      } catch (e) {
        console.error('Error updating lead:', e);
        toast.error(e.message || 'Failed to update lead');
        return null;
      }
    },
    [socket, user]
  );

  // ── Delete Lead ──
  const deleteLead = useCallback(
    async (id) => {
      if (!user?.firebase_uid || !id) return false;
      
      try {
        await setSupabaseAuth(user);
        const userId = await getSupabaseUserId(user.firebase_uid);
        if (!userId) {
          throw new Error('User profile not found in Supabase');
        }

        const { error } = await supabase
          .from('leads')
          .delete()
          .eq('id', id)
          .eq('firebase_uid', userId);
          
        if (error) throw error;

        setLeadsState((prev) => prev.filter((l) => l.id !== id));
        if (socket) socket.emit('lead_deleted', { id });
        toast.success('Lead deleted');
        return true;
      } catch (e) {
        console.error('Error deleting lead:', e);
        toast.error(e.message || 'Failed to delete lead');
        return false;
      }
    },
    [socket, user]
  );

  // ── WebSocket listeners ──
  useEffect(() => {
    if (!socket) return;

    const handleLeadCreated = (lead) => {
      if (lead) setLeadsState((prev) => (prev.some((l) => l.id === lead.id) ? prev : [...prev, lead]));
    };
    const handleLeadUpdated = (lead) => {
      if (lead) setLeadsState((prev) => prev.map((l) => (l.id === lead.id ? lead : l)));
    };
    const handleLeadDeleted = ({ id }) => {
      if (id) setLeadsState((prev) => prev.filter((l) => l.id !== id));
    };

    socket.on('lead_created', handleLeadCreated);
    socket.on('lead_updated', handleLeadUpdated);
    socket.on('lead_deleted', handleLeadDeleted);

    return () => {
      socket.off('lead_created', handleLeadCreated);
      socket.off('lead_updated', handleLeadUpdated);
      socket.off('lead_deleted', handleLeadDeleted);
    };
  }, [socket]);

  return (
    <LeadContext.Provider
      value={{
        leads,
        setLeads: setLeadsState,
        addLead,
        updateLead,
        deleteLead,
        fetchLeads,
        loading,
      }}
    >
      {children}
    </LeadContext.Provider>
  );
}

LeadProvider.propTypes = { children: PropTypes.node.isRequired };

export default LeadContext;
