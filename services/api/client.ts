/**
 * Service API avec axios
 * Utilise async/await pour les appels API
 */

import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

// Configuration de base
const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.graceregistry.ht';

// Créer une instance axios
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour les requêtes
apiClient.interceptors.request.use(
  async (config) => {
    // Ajouter le token d'authentification si disponible
    // TODO: Récupérer le token depuis authStore
    // const token = await getAuthToken();
    // if (token) {
    //   config.headers.Authorization = `Bearer ${token}`;
    // }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Intercepteur pour les réponses
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response;
  },
  async (error) => {
    // Gérer les erreurs globales
    if (error.response?.status === 401) {
      // TODO: Rediriger vers login
    }
    return Promise.reject(error);
  }
);

/**
 * Fonction générique pour les requêtes GET
 */
export async function get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.get<T>(url, config);
    return response.data;
  } catch (error) {
    console.error('GET Error:', error);
    throw error;
  }
}

/**
 * Fonction générique pour les requêtes POST
 */
export async function post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.post<T>(url, data, config);
    return response.data;
  } catch (error) {
    console.error('POST Error:', error);
    throw error;
  }
}

/**
 * Fonction générique pour les requêtes PUT
 */
export async function put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.put<T>(url, data, config);
    return response.data;
  } catch (error) {
    console.error('PUT Error:', error);
    throw error;
  }
}

/**
 * Fonction générique pour les requêtes DELETE
 */
export async function del<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
  try {
    const response = await apiClient.delete<T>(url, config);
    return response.data;
  } catch (error) {
    console.error('DELETE Error:', error);
    throw error;
  }
}

export default apiClient;

