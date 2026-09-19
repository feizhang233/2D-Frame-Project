import { createTheme } from '@mui/material/styles'

/**
 * Frame Studio theme — Material UI v7 createTheme.
 * Shared light-sage palette for the 2D and 3D workspaces.
 */
export const theme = createTheme({
  cssVariables: true,
  palette: {
    mode: 'light',
    primary: {
      main: '#437653',
      light: '#d9efdf',
      dark: '#28563a',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#62766a',
      light: '#94ac9c',
      dark: '#344d3e',
    },
    error: {
      main: '#b63f52',
    },
    success: {
      main: '#33734b',
    },
    warning: {
      main: '#9b6511',
    },
    info: {
      main: '#437653',
    },
    background: {
      default: '#f0f6f1',
      paper: '#ffffff',
    },
    divider: '#d5e3d8',
    text: {
      primary: '#263b2d',
      secondary: '#64786a',
    },
    grey: { 50: '#f6faf7', 100: '#edf5ef', 200: '#deeadf', 300: '#ccdccc' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h6: { fontWeight: 600 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  shape: {
    borderRadius: 10,
  },
  components: {
    MuiToggleButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          '&.Mui-selected': { backgroundColor: theme.palette.primary.light, color: theme.palette.primary.dark,
            '&:hover': { backgroundColor: theme.palette.primary.light } },
        }),
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        containedPrimary: ({ theme }) => ({
          backgroundColor: theme.palette.primary.light,
          color: theme.palette.primary.dark,
          border: `1px solid ${theme.palette.divider}`,
          '&:hover': { backgroundColor: '#c5e4ce' },
        }),
      },
    },
    MuiAppBar: {
      defaultProps: {
        color: 'default',
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderBottom: '1px solid',
          borderColor: 'divider',
          backgroundImage: 'none',
        },
      },
    },
    MuiTooltip: {
      defaultProps: {
        arrow: true,
        enterDelay: 400,
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
        variant: 'outlined',
      },
    },
  },
})
