import pandas as pd

# Read Excel files
african_data = pd.read_excel('African.xlsx')
asian_data = pd.read_excel('Asian.xlsx')

# Save as CSV
african_data.to_csv('African.csv', index=False)
asian_data.to_csv('Asian.csv', index=False)

print("Conversion completed successfully!")
