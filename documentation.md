# Tuberculosis Data Visualization Project Documentation  
### Data Analytics and Visualization (Fall 2023)  

## Project Overview  

This project focused on visualizing tuberculosis (TB) data from Asia and Africa to uncover patterns, trends, and regional insights. The objective was to transform complex datasets into meaningful, interactive visualizations using D3.js, enabling users to understand the data effectively.  

**Team Members:** Yahya Qureshi, Waleed Saeed, AbuBakar  
**Submitted to:** Miss Zonera  

---

## 1. Challenges and Initial Steps  

### **Initial Hurdles**  
The dataset presented significant challenges, such as missing values, inconsistent formatting, and discrepancies in column naming between the Asian and African data files. These issues made it clear that effective preprocessing and data cleaning would be critical to the project's success.  

### **Overcoming Dataset Challenges**  
- **Handling Missing Values:** Missing data caused visualizations to malfunction, requiring a preprocessing pipeline to clean and filter the datasets.  
- **Standardizing Formats:** Column names and inconsistent formatting across datasets were harmonized to ensure compatibility during the visualization process.  

---

## 2. Data Preprocessing and Cleaning  

### Key Steps in Data Cleaning:  
1. **Consistent Column Naming:** Unified column headers such as "Country" and "Country Name" to a standard format for seamless merging.  
2. **Filtering Data:** Removed records with null or invalid values, focusing only on meaningful data points.  
3. **Preprocessing Pipeline:** Built a structured pipeline to handle discrepancies in data formatting and missing values efficiently.  

---

## 3. Evolution of Visualizations  

### **Sunburst Chart Development**  
The hierarchical structure of TB cases across countries was effectively visualized using a sunburst chart. This visualization highlighted regional and sub-regional data distribution in an intuitive manner.  
- **Challenge:** Understanding and implementing `d3.hierarchy()` for hierarchical visualizations.  
- **Outcome:** Successfully created an interactive sunburst chart with smooth animations and consistent color schemes, effectively conveying data relationships.  

### **Force-Directed Graph**  
This visualization initially faced challenges with excessive complexity due to the inclusion of all connections. By filtering and optimizing the force-directed graph, we presented only meaningful connections, making the data comprehensible.  
- **Key Learning:** Optimizing force strength and linkage thresholds is essential for clarity in network visualizations.  

### **Time Slider Integration**  
A time slider was implemented to showcase the temporal aspect of TB cases. This interactive feature allowed users to observe changes over time dynamically.  
- **Enhancement:** Added animation for smooth transitions between years, providing a more engaging user experience.  

---

## 4. Interactive Features and Enhancements  

### **Region-Based Filtering**  
Implemented a dropdown menu for filtering data by region, ensuring cleaner UI and improved usability.  

### **Color Scales**  
Adopted D3.js color scales for consistency across all visualizations, improving clarity and aesthetics.  

### **Responsive Design**  
Ensured visualizations adapted to different screen sizes using SVG viewBox and `preserveAspectRatio`.  

---

## 5. Key Challenges and Solutions  

1. **Performance Optimization:**  
   - **Problem:** Lag during updates with large datasets.  
   - **Solution:** Leveraged D3's enter-update-exit pattern to avoid unnecessary element re-creation.  

2. **Consistent Aesthetics:**  
   - Addressed color inconsistency by applying a unified color scheme across all charts.  

3. **Mobile Responsiveness:**  
   - Incorporated adaptive SVG scaling to ensure visualizations displayed correctly on varying screen sizes.  

---

## 6. Insights and Discoveries  

### **Data Patterns Identified:**  
- Clear regional trends and correlations were observed, particularly in seasonal TB case variations.  
- Identified hotspots and trends, enabling a deeper understanding of regional disparities in TB prevalence.  

### **Impact of Visualization:**  
- Interactive elements such as filters and time sliders significantly enhanced user engagement and understanding.  
- The sunburst chart effectively depicted hierarchical relationships in TB cases, while the force-directed graph provided valuable insights into regional connections.  

---

## 7. Future Improvements  

1. Expand filtering options for more granular data exploration.  
2. Enhance mobile responsiveness to improve accessibility.  
3. Add detailed tooltips for better data interpretation.  
4. Implement export functionality for user convenience.  
5. Optimize performance further to handle larger datasets seamlessly.  

---

## 8. Acknowledgments  

We extend our gratitude to:  
- **Miss Zonera** for her guidance throughout this project.  
- **D3.js Documentation** and various learning resources for aiding our understanding of advanced visualization techniques.  

---

## Final Thoughts  

This project was an invaluable learning experience in data visualization. By tackling real-world data challenges and implementing advanced visualization techniques, we gained deep insights into the power of interactive analytics. The journey underscored the importance of meticulous data preprocessing, efficient coding practices, and user-centric design in creating impactful visualizations.  

