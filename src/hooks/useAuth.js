import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContextObject';

export const useAuth = () => useContext(AuthContext);
