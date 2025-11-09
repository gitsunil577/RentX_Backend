# 🚗 Vehicle Rental Pricing Guide (India)

## Recommended Daily Rental Rates in INR

All prices are suggested per-day rates in **Indian Rupees (₹)** for self-drive vehicle rentals.

---

## 🏍️ **Two-Wheelers**

### **Bicycles**
- **Basic Bicycle**: ₹100 - ₹200 per day
- **Mountain Bike**: ₹250 - ₹400 per day
- **Premium/Sports Bicycle**: ₹500 - ₹800 per day

**Recommended Default**: **₹150/day** (Basic), **₹300/day** (Premium)

---

### **Scooters**
- **Honda Activa / TVS Jupiter**: ₹400 - ₹600 per day
- **Vespa / Suzuki Access**: ₹500 - ₹700 per day
- **Electric Scooters (Ola S1/Ather)**: ₹600 - ₹900 per day

**Recommended Default**: **₹500/day**

---

### **Bikes (Motorcycles)**
- **Standard 100-150cc (Hero Splendor, Bajaj Pulsar)**: ₹500 - ₹800 per day
- **Sports 200-300cc (KTM Duke, Royal Enfield)**: ₹1,000 - ₹1,500 per day
- **Premium 400cc+ (Harley, Kawasaki, BMW)**: ₹2,500 - ₹5,000 per day

**Recommended Default**: **₹700/day** (Standard), **₹1,200/day** (Sports), **₹3,500/day** (Premium)

---

## 🚙 **Four-Wheelers**

### **Hatchback Cars**
- **Maruti Alto / Wagon R**: ₹800 - ₹1,200 per day
- **Hyundai i10 / Santro**: ₹1,000 - ₹1,500 per day
- **Maruti Swift / Hyundai i20**: ₹1,200 - ₹1,800 per day

**Recommended Default**: **₹1,200/day**

---

### **Sedan Cars**
- **Honda City / Maruti Ciaz**: ₹1,500 - ₹2,200 per day
- **Hyundai Verna / Volkswagen Vento**: ₹1,800 - ₹2,500 per day
- **Toyota Corolla / Honda Accord**: ₹2,500 - ₹3,500 per day

**Recommended Default**: **₹2,000/day**

---

### **SUVs**
- **Maruti Vitara Brezza / Hyundai Venue**: ₹1,800 - ₹2,500 per day
- **Hyundai Creta / Kia Seltos**: ₹2,500 - ₹3,500 per day
- **MG Hector / Tata Harrier**: ₹3,000 - ₹4,000 per day
- **Toyota Fortuner / Ford Endeavour**: ₹4,500 - ₹6,500 per day
- **Mahindra Thar / Jeep Compass**: ₹3,500 - ₹5,000 per day

**Recommended Default**: **₹2,800/day** (Compact), **₹4,000/day** (Mid-size), **₹5,500/day** (Full-size)

---

### **Electric Vehicles (EVs)**
- **Tata Nexon EV**: ₹2,000 - ₹2,800 per day
- **MG ZS EV**: ₹2,500 - ₹3,500 per day
- **Hyundai Kona Electric**: ₹3,000 - ₹4,000 per day

**Recommended Default**: **₹2,500/day**

---

### **Luxury Cars**
- **BMW 3 Series / Mercedes C-Class**: ₹6,000 - ₹10,000 per day
- **Audi A4 / BMW 5 Series**: ₹8,000 - ₹12,000 per day
- **Mercedes S-Class / BMW 7 Series**: ₹15,000 - ₹25,000 per day
- **Jaguar / Porsche**: ₹20,000 - ₹40,000 per day

**Recommended Default**: **₹8,000/day** (Entry Luxury), **₹15,000/day** (Premium Luxury)

---

### **Trucks / Commercial Vehicles**
- **Tata Ace / Mahindra Bolero Pickup**: ₹1,500 - ₹2,500 per day
- **Ashok Leyland Dost**: ₹2,000 - ₹3,000 per day
- **Eicher / Tata 407**: ₹3,500 - ₹5,000 per day

**Recommended Default**: **₹2,000/day**

---

## 💡 **Pricing Factors to Consider**

### **Base Price Adjustments:**

1. **Location**
   - **Metro Cities** (Mumbai, Delhi, Bangalore): +20-30%
   - **Tier-2 Cities** (Pune, Jaipur, Chandigarh): Base price
   - **Tier-3 Cities / Towns**: -15-20%

2. **Season / Demand**
   - **Peak Season** (Dec-Jan, Summer holidays): +30-50%
   - **Festivals / Long weekends**: +40-60%
   - **Off-season**: -10-20%

3. **Vehicle Condition**
   - **Brand New** (< 6 months): +20-30%
   - **Excellent** (< 2 years): +10-15%
   - **Good** (2-4 years): Base price
   - **Average** (4+ years): -15-25%

4. **Duration Discounts**
   - **1 day**: Full price
   - **2-3 days**: -5% per day
   - **4-7 days**: -10% per day
   - **Weekly** (7-14 days): -15% per day
   - **Monthly** (30+ days): -30% per day

---

## 📊 **Quick Reference Table**

| Category | Vehicle Type | Per Day (₹) | Weekly (₹) | Monthly (₹) |
|----------|-------------|-------------|------------|-------------|
| Bicycles | Basic | 150 | 900 | 3,000 |
| Bicycles | Premium | 300 | 1,800 | 6,000 |
| Scooters | Standard | 500 | 3,000 | 10,000 |
| Bikes | 100-150cc | 700 | 4,200 | 14,000 |
| Bikes | Sports (200cc+) | 1,200 | 7,200 | 24,000 |
| Cars | Hatchback | 1,200 | 7,200 | 24,000 |
| Cars | Sedan | 2,000 | 12,000 | 40,000 |
| SUVs | Compact | 2,800 | 16,800 | 56,000 |
| SUVs | Full-size | 5,500 | 33,000 | 110,000 |
| EVs | Standard | 2,500 | 15,000 | 50,000 |
| Luxury | Entry | 8,000 | 48,000 | 160,000 |
| Trucks | Small | 2,000 | 12,000 | 40,000 |

---

## 🎯 **Implementation Recommendations**

### **For Your Database:**

When adding vehicles to your system, use these suggested prices based on category:

```javascript
// Example vehicle pricing
const vehiclePricing = {
  "Bicycles": 150,
  "Scooters": 500,
  "Bikes": 700,
  "Cars": 1200,
  "SUVs": 2800,
  "Electric Vehicles": 2500,
  "Trucks": 2000,
  "Luxury": 8000
};
```

### **Additional Charges to Consider:**

- **Security Deposit**: ₹2,000 - ₹50,000 (depending on vehicle value)
- **Fuel**: Usually customer's responsibility
- **Insurance**: ₹100 - ₹500 per day (optional)
- **Helmet Rental** (bikes): ₹50 per day
- **GPS Device**: ₹100 per day
- **Driver Service**: ₹800 - ₹1,500 per day (if offered)
- **Delivery/Pickup**: ₹200 - ₹1,000 (based on distance)

---

## ⚠️ **Important Notes**

1. All prices are **per day** rates for **self-drive** rentals
2. Prices are in **INR (Indian Rupees)**
3. **Fuel charges** are typically **NOT included**
4. Prices vary by **city, season, and vehicle condition**
5. **Long-term rentals** should offer **discounts**
6. Consider adding **weekend surge pricing** (+20-30%)
7. Popular models command **premium pricing**

---

## 📞 **Market Research Sources**

These prices are based on current market rates from:
- Zoomcar (zoomcar.com)
- Revv (revv.co.in)
- Drivezy (drivezy.com)
- Local rental agencies
- Individual vehicle owners

*Last Updated: November 2025*

---

**💡 Pro Tip**: Start with competitive base prices and adjust based on demand, seasonality, and local market conditions. Monitor competitor pricing regularly!
