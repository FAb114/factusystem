import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/**
 * Store de autenticación con Zustand
 * Maneja el estado de usuario, sesión y permisos
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      // Estado inicial
      user: null,
      isAuthenticated: false,
      selectedBranch: null,
      cashSession: null,
      loading: false,
      error: null,

      // ===========================================
      // ACCIONES DE AUTENTICACIÓN
      // ===========================================

      /**
       * Iniciar sesión
       */
      login: async (credentials) => {
        set({ loading: true, error: null });

        try {
          // TODO: Integrar con Supabase o tu API
          // Simulación temporal
          const { username, password } = credentials;

          // Simulación de validación
          if (username === 'admin' && password === 'admin') {
            const user = {
              id: '1',
              username: 'admin',
              email: 'admin@factusystem.com',
              fullName: 'Administrador',
              role: 'admin',
              permissions: ['all'],
              branches: [
                { id: '1', name: 'Sucursal Principal' },
                { id: '2', name: 'Sucursal Centro' },
              ],
              createdAt: new Date().toISOString(),
            };

            set({
              user,
              isAuthenticated: true,
              loading: false,
              error: null,
            });

            return { success: true, user };
          } else {
            throw new Error('Credenciales inválidas');
          }
        } catch (error) {
          set({
            loading: false,
            error: error.message,
          });
          return { success: false, error: error.message };
        }
      },

      /**
       * Cerrar sesión
       */
      logout: () => {
        set({
          user: null,
          isAuthenticated: false,
          selectedBranch: null,
          cashSession: null,
          error: null,
        });
      },

      /**
       * Verificar autenticación (al cargar la app)
       */
      checkAuth: () => {
        const { user } = get();
        if (user) {
          set({ isAuthenticated: true });
        }
      },

      // ===========================================
      // GESTIÓN DE SUCURSALES
      // ===========================================

      /**
       * Seleccionar sucursal de trabajo
       */
      selectBranch: (branch) => {
        set({ selectedBranch: branch });
      },

      /**
       * Obtener sucursal actual
       */
      getCurrentBranch: () => {
        return get().selectedBranch;
      },

      // ===========================================
      // GESTIÓN DE CAJA
      // ===========================================

      /**
       * Abrir sesión de caja
       */
      openCashSession: (data) => {
        const { user, selectedBranch } = get();

        const cashSession = {
          id: Date.now().toString(),
          userId: user.id,
          branchId: selectedBranch?.id,
          openingAmount: data.amount,
          openingDate: new Date().toISOString(),
          status: 'open',
          currency: 'ARS',
        };

        set({ cashSession });
        return cashSession;
      },

      /**
       * Cerrar sesión de caja
       */
      closeCashSession: (closingData) => {
        const { cashSession } = get();

        if (!cashSession) {
          throw new Error('No hay sesión de caja abierta');
        }

        const updatedSession = {
          ...cashSession,
          closingAmount: closingData.amount,
          closingDate: new Date().toISOString(),
          status: 'closed',
          difference: closingData.amount - cashSession.openingAmount,
          notes: closingData.notes,
        };

        set({ cashSession: updatedSession });
        return updatedSession;
      },

      /**
       * Verificar si hay caja abierta
       */
      hasCashSessionOpen: () => {
        const { cashSession } = get();
        return cashSession?.status === 'open';
      },

      // ===========================================
      // PERMISOS
      // ===========================================

      /**
       * Verificar si el usuario tiene un permiso específico
       */
      hasPermission: (permission) => {
        const { user } = get();
        if (!user) return false;
        if (user.permissions.includes('all')) return true;
        return user.permissions.includes(permission);
      },

      /**
       * Verificar si el usuario tiene un rol específico
       */
      hasRole: (role) => {
        const { user } = get();
        return user?.role === role;
      },

      // ===========================================
      // UTILIDADES
      // ===========================================

      /**
       * Actualizar datos del usuario
       */
      updateUser: (updates) => {
        const { user } = get();
        set({
          user: { ...user, ...updates },
        });
      },

      /**
       * Limpiar errores
       */
      clearError: () => {
        set({ error: null });
      },

      /**
       * Obtener información completa del estado
       */
      getAuthState: () => {
        return get();
      },
    }),
    {
      name: 'factusystem-auth', // Nombre en localStorage
      partialize: (state) => ({
        user: state.user,
        isAuthenticated: state.isAuthenticated,
        selectedBranch: state.selectedBranch,
        cashSession: state.cashSession,
      }),
    }
  )
);

// ===========================================
// HOOKS AUXILIARES
// ===========================================

/**
 * Hook para verificar si el usuario está autenticado
 */
export const useIsAuthenticated = () => {
  return useAuthStore((state) => state.isAuthenticated);
};

/**
 * Hook para obtener el usuario actual
 */
export const useCurrentUser = () => {
  return useAuthStore((state) => state.user);
};

/**
 * Hook para obtener la sucursal actual
 */
export const useCurrentBranch = () => {
  return useAuthStore((state) => state.selectedBranch);
};

/**
 * Hook para verificar permisos
 */
export const useHasPermission = (permission) => {
  return useAuthStore((state) => state.hasPermission(permission));
};