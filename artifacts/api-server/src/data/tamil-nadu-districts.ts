// Civic places for 10 Tamil Nadu districts, used by seed-districts.ts.
//
// Names, places and approximate coordinates are real. Operational figures (parking spots,
// hourly prices, opening hours, book counts, bus fares and frequencies) are illustrative
// demo values, not official data. Only the Chennai Metro lines and MTC 21G use official
// route numbers; other route codes are portal codes for real origin–destination pairs.

export type ParkingLotSeed = {
  name: string; address: string; latitude: number; longitude: number;
  totalSpots: number; pricePerHour: number; openingTime: string; closingTime: string; amenities: string[];
};
export type ParkSeed = {
  name: string; description: string; address: string; latitude: number; longitude: number;
  area: number; openingTime: string; closingTime: string; amenities: string[];
};
export type BookSeed = { title: string; author: string; genre: string; publishedYear: number | null; totalCopies: number };
export type LibrarySeed = {
  name: string; address: string; openingTime: string; closingTime: string; totalBooks: number; books: BookSeed[];
};
export type RouteSeed = {
  code: string; name: string; type: "bus" | "metro"; origin: string; destination: string;
  frequency: number; operatingHours: string; fare: number; totalStops: number;
  alert?: { title: string; message: string; severity: "info" | "warning" };
};
export type DistrictSeed = {
  name: string; slug: string;
  parkingLots: ParkingLotSeed[]; parks: ParkSeed[]; libraries: LibrarySeed[]; routes: RouteSeed[];
};

const book = (title: string, author: string, genre: string, publishedYear: number | null, totalCopies = 3): BookSeed =>
  ({ title, author, genre, publishedYear, totalCopies });

export const DISTRICTS: DistrictSeed[] = [
  {
    name: "Chennai", slug: "chennai",
    parkingLots: [
      { name: "Chennai Central Railway Station Parking", address: "Poonamallee High Road, Park Town, Chennai 600003", latitude: 13.0827, longitude: 80.2757, totalSpots: 450, pricePerHour: 20, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Two-wheeler Bay"] },
      { name: "T. Nagar Multi-Level Car Parking", address: "Thiyagaraya Road, T. Nagar, Chennai 600017", latitude: 13.0405, longitude: 80.2355, totalSpots: 220, pricePerHour: 40, openingTime: "07:00", closingTime: "23:00", amenities: ["CCTV", "Lift Access", "Disabled Access"] },
      { name: "Chennai Airport Multi-Level Car Parking", address: "Chennai International Airport, Meenambakkam, Chennai 600027", latitude: 12.9900, longitude: 80.1693, totalSpots: 2000, pricePerHour: 60, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "EV Charging", "CCTV", "Disabled Access"] },
    ],
    parks: [
      { name: "Semmozhi Poonga", description: "A botanical garden on Cathedral Road with themed gardens, a bonsai section and walking paths, opened in 2010.", address: "Cathedral Road, Teynampet, Chennai 600086", latitude: 13.0503, longitude: 80.2517, area: 8, openingTime: "10:00", closingTime: "19:00", amenities: ["Botanical Garden", "Walking Trails", "Bonsai Garden", "Restrooms"] },
      { name: "Guindy Children's Park", description: "A children's park and small zoo inside the Guindy National Park campus, one of the few national parks within a city.", address: "Sardar Patel Road, Guindy, Chennai 600022", latitude: 13.0067, longitude: 80.2370, area: 22, openingTime: "09:00", closingTime: "17:30", amenities: ["Children's Playground", "Mini Zoo", "Snake Park", "Parking"] },
      { name: "Tholkappia Poonga (Adyar Eco Park)", description: "A restored wetland eco-park on the Adyar estuary with native plants, bird watching and guided nature walks.", address: "Adyar Poonga, Raja Annamalaipuram, Chennai 600028", latitude: 13.0170, longitude: 80.2650, area: 58, openingTime: "08:30", closingTime: "17:30", amenities: ["Bird Watching", "Walking Trails", "Wetland", "Guided Walks"] },
    ],
    libraries: [
      { name: "Anna Centenary Library", address: "Gandhi Mandapam Road, Kotturpuram, Chennai 600085", openingTime: "09:00", closingTime: "20:00", totalBooks: 550000, books: [
        book("Ponniyin Selvan", "Kalki Krishnamurthy", "Historical Fiction", null, 6),
        book("Wings of Fire", "A. P. J. Abdul Kalam with Arun Tiwari", "Autobiography", 1999, 5),
        book("Sila Nerangalil Sila Manithargal", "Jayakanthan", "Novel", 1970),
      ] },
      { name: "Connemara Public Library", address: "Pantheon Road, Egmore, Chennai 600008", openingTime: "09:00", closingTime: "19:30", totalBooks: 600000, books: [
        book("Thirukkural", "Thiruvalluvar", "Classical Literature", null, 8),
      ] },
    ],
    routes: [
      { code: "L1", name: "Chennai Metro Blue Line", type: "metro", origin: "Wimco Nagar Depot", destination: "Chennai International Airport", frequency: 7, operatingHours: "05:00–23:00", fare: 50, totalStops: 26, alert: { title: "Peak-hour frequency", message: "Blue Line trains run more often during morning and evening peak hours; expect longer gaps late at night.", severity: "info" } },
      { code: "L2", name: "Chennai Metro Green Line", type: "metro", origin: "Puratchi Thalaivar Dr. M.G.R. Central", destination: "St. Thomas Mount", frequency: 7, operatingHours: "05:00–23:00", fare: 40, totalStops: 17 },
      { code: "21G", name: "Broadway — Tambaram", type: "bus", origin: "Broadway Bus Terminus", destination: "Tambaram", frequency: 10, operatingHours: "05:00–22:30", fare: 25, totalStops: 38 },
    ],
  },
  {
    name: "Coimbatore", slug: "coimbatore",
    parkingLots: [
      { name: "Coimbatore Junction Railway Station Parking", address: "State Bank Road, Gopalapuram, Coimbatore 641018", latitude: 10.9976, longitude: 76.9672, totalSpots: 300, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Two-wheeler Bay"] },
      { name: "R.S. Puram Multi-Level Car Parking", address: "D.B. Road, R.S. Puram, Coimbatore 641002", latitude: 11.0089, longitude: 76.9500, totalSpots: 370, pricePerHour: 30, openingTime: "06:00", closingTime: "23:00", amenities: ["CCTV", "Lift Access", "EV Charging"] },
      { name: "Coimbatore International Airport Parking", address: "Avinashi Road, Peelamedu, Coimbatore 641014", latitude: 11.0300, longitude: 77.0434, totalSpots: 600, pricePerHour: 50, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Disabled Access"] },
    ],
    parks: [
      { name: "V.O.C. Park", description: "Coimbatore's best-known civic park, next to the V.O.C. Park Zoo, with lawns, a children's play area and a toy train.", address: "Park Gate Road, Gopalapuram, Coimbatore 641018", latitude: 11.0005, longitude: 76.9640, area: 20, openingTime: "06:00", closingTime: "20:00", amenities: ["Children's Playground", "Toy Train", "Walking Trails", "Zoo"] },
      { name: "Valankulam Lakefront", description: "A redeveloped lakefront promenade on Valankulam tank with paved paths, seating and evening lighting.", address: "Valankulam, Sungam Bypass Road, Coimbatore 641045", latitude: 10.9940, longitude: 76.9700, area: 12, openingTime: "05:30", closingTime: "21:00", amenities: ["Lakefront Deck", "Walking Trails", "Cycling Track", "Seating"] },
    ],
    libraries: [
      { name: "District Central Library, Coimbatore", address: "R.S. Puram, Coimbatore", openingTime: "08:00", closingTime: "20:00", totalBooks: 120000, books: [
        book("Sivagamiyin Sabatham", "Kalki Krishnamurthy", "Historical Fiction", null, 4),
        book("Kurinji Malar", "Na. Parthasarathy", "Novel", null),
        book("Sapiens: A Brief History of Humankind", "Yuval Noah Harari", "History", 2014),
      ] },
    ],
    routes: [
      { code: "CBE-1", name: "Gandhipuram — Airport", type: "bus", origin: "Gandhipuram Town Bus Stand", destination: "Coimbatore International Airport", frequency: 15, operatingHours: "05:00–23:00", fare: 20, totalStops: 12 },
      { code: "CBE-2", name: "Gandhipuram — Marudhamalai", type: "bus", origin: "Gandhipuram Town Bus Stand", destination: "Marudhamalai Murugan Temple", frequency: 15, operatingHours: "05:30–22:00", fare: 20, totalStops: 18 },
      { code: "CBE-3", name: "Ukkadam — Singanallur", type: "bus", origin: "Ukkadam Bus Stand", destination: "Singanallur Bus Stand", frequency: 8, operatingHours: "05:30–22:30", fare: 15, totalStops: 14 },
    ],
  },
  {
    name: "Madurai", slug: "madurai",
    parkingLots: [
      { name: "Madurai Junction Railway Station Parking", address: "West Veli Street, Madurai 625001", latitude: 9.9195, longitude: 78.1105, totalSpots: 280, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Two-wheeler Bay"] },
      { name: "Periyar Bus Stand Parking", address: "Periyar Bus Stand, Madurai 625001", latitude: 9.9160, longitude: 78.1150, totalSpots: 250, pricePerHour: 20, openingTime: "05:00", closingTime: "23:00", amenities: ["CCTV", "Two-wheeler Bay"] },
      { name: "Mattuthavani Integrated Bus Terminus Parking", address: "Mattuthavani, Madurai 625007", latitude: 9.9450, longitude: 78.1580, totalSpots: 350, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV"] },
    ],
    parks: [
      { name: "Eco Park, Madurai", description: "A landscaped park near the Collectorate with musical fountains, lawns and an evening light show.", address: "Alagar Kovil Road, Tallakulam, Madurai 625002", latitude: 9.9370, longitude: 78.1350, area: 5, openingTime: "06:00", closingTime: "21:00", amenities: ["Musical Fountain", "Walking Trails", "Children's Playground"] },
      { name: "Rajaji Children's Park", description: "A long-running children's park near the Gandhi Memorial Museum with play equipment and shaded lawns.", address: "Tamukkam, Madurai 625020", latitude: 9.9300, longitude: 78.1380, area: 6, openingTime: "09:00", closingTime: "20:00", amenities: ["Children's Playground", "Toy Train", "Food Kiosks"] },
    ],
    libraries: [
      { name: "Kalaignar Centenary Library", address: "Puthu Natham Road, Madurai 625002", openingTime: "08:00", closingTime: "20:00", totalBooks: 300000, books: [
        book("Kaval Kottam", "Su. Venkatesan", "Historical Fiction", 2008, 4),
        book("Velpari", "Su. Venkatesan", "Historical Fiction", null, 5),
      ] },
      { name: "District Central Library, Madurai", address: "Madurai", openingTime: "08:00", closingTime: "20:00", totalBooks: 110000, books: [
        book("Silappathikaram", "Ilango Adigal", "Classical Literature", null, 4),
      ] },
    ],
    routes: [
      { code: "MDU-1", name: "Mattuthavani — Periyar", type: "bus", origin: "Mattuthavani Integrated Bus Terminus", destination: "Periyar Bus Stand", frequency: 5, operatingHours: "04:30–23:30", fare: 12, totalStops: 11, alert: { title: "Chithirai Festival crowds", message: "During the Chithirai festival (April–May) extra buses run to the city centre and some roads near the Meenakshi Amman Temple are closed.", severity: "warning" } },
      { code: "MDU-2", name: "Periyar — Thiruparankundram", type: "bus", origin: "Periyar Bus Stand", destination: "Thiruparankundram", frequency: 10, operatingHours: "05:00–22:30", fare: 10, totalStops: 9 },
      { code: "MDU-3", name: "Periyar — Alagar Kovil", type: "bus", origin: "Periyar Bus Stand", destination: "Alagar Kovil", frequency: 20, operatingHours: "05:30–21:00", fare: 20, totalStops: 15 },
    ],
  },
  {
    name: "Tiruchirappalli", slug: "tiruchirappalli",
    parkingLots: [
      { name: "Tiruchirappalli Junction Railway Station Parking", address: "Junction Road, Tiruchirappalli 620001", latitude: 10.7955, longitude: 78.6855, totalSpots: 260, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Two-wheeler Bay"] },
      { name: "Tiruchirappalli International Airport Parking", address: "Airport Road, Tiruchirappalli 620007", latitude: 10.7654, longitude: 78.7097, totalSpots: 400, pricePerHour: 40, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Disabled Access"] },
      { name: "Srirangam Temple Parking", address: "Srirangam, Tiruchirappalli 620006", latitude: 10.8625, longitude: 78.6896, totalSpots: 300, pricePerHour: 20, openingTime: "05:00", closingTime: "22:00", amenities: ["CCTV", "Restrooms", "Two-wheeler Bay"] },
    ],
    parks: [
      { name: "Mukkombu (Upper Anicut) Park", description: "A riverside picnic spot where the Kollidam branches off the Cauvery, with gardens around the Upper Anicut barrage.", address: "Mukkombu, Tiruchirappalli 639103", latitude: 10.8650, longitude: 78.5960, area: 15, openingTime: "09:00", closingTime: "18:00", amenities: ["Riverside Garden", "Children's Playground", "Picnic Area"] },
      { name: "Tropical Butterfly Conservatory", description: "A butterfly park on Srirangam island with host-plant gardens, a conservatory dome and nature trails.", address: "Melur, Srirangam, Tiruchirappalli 620006", latitude: 10.8720, longitude: 78.6600, area: 27, openingTime: "09:30", closingTime: "18:00", amenities: ["Butterfly Garden", "Walking Trails", "Children's Playground"] },
    ],
    libraries: [
      { name: "District Central Library, Tiruchirappalli", address: "Tiruchirappalli", openingTime: "08:00", closingTime: "20:00", totalBooks: 115000, books: [
        book("The Guide", "R. K. Narayan", "Novel", 1958),
        book("Parthiban Kanavu", "Kalki Krishnamurthy", "Historical Fiction", null),
        book("Agal Vilakku", "Mu. Varadarajan", "Novel", null),
      ] },
    ],
    routes: [
      { code: "TPJ-1", name: "Central Bus Stand — Srirangam", type: "bus", origin: "Central Bus Stand", destination: "Srirangam", frequency: 6, operatingHours: "04:30–23:00", fare: 12, totalStops: 10, alert: { title: "Vaikunta Ekadasi at Srirangam", message: "Heavy crowds around Srirangam during Vaikunta Ekadasi (December–January); special buses operate from the Central Bus Stand.", severity: "warning" } },
      { code: "TPJ-2", name: "Chathiram — Samayapuram", type: "bus", origin: "Chathiram Bus Stand", destination: "Samayapuram Mariamman Temple", frequency: 10, operatingHours: "05:00–22:00", fare: 18, totalStops: 12 },
      { code: "TPJ-3", name: "Central Bus Stand — Airport", type: "bus", origin: "Central Bus Stand", destination: "Tiruchirappalli International Airport", frequency: 20, operatingHours: "05:00–22:00", fare: 15, totalStops: 7 },
    ],
  },
  {
    name: "Salem", slug: "salem",
    parkingLots: [
      { name: "Salem Junction Railway Station Parking", address: "Suramangalam, Salem 636005", latitude: 11.6713, longitude: 78.1129, totalSpots: 220, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Two-wheeler Bay"] },
      { name: "Salem New Bus Stand Parking", address: "Omalur Main Road, Salem 636004", latitude: 11.6720, longitude: 78.1400, totalSpots: 260, pricePerHour: 15, openingTime: "05:00", closingTime: "23:00", amenities: ["CCTV", "Two-wheeler Bay"] },
      { name: "Yercaud Lake Parking", address: "Yercaud, Salem 636601", latitude: 11.7790, longitude: 78.2090, totalSpots: 150, pricePerHour: 30, openingTime: "07:00", closingTime: "19:00", amenities: ["CCTV", "Restrooms"] },
    ],
    parks: [
      { name: "Anna Park, Yercaud", description: "A hill-station garden next to Yercaud Lake that hosts the flower show during the Yercaud Summer Festival.", address: "Near Yercaud Lake, Yercaud 636601", latitude: 11.7800, longitude: 78.2100, area: 10, openingTime: "08:00", closingTime: "18:00", amenities: ["Flower Garden", "Walking Trails", "Lake View"] },
      { name: "Government Rose Garden, Yercaud", description: "A terraced garden with hundreds of rose varieties and views over the Shevaroy Hills.", address: "Yercaud 636601", latitude: 11.7760, longitude: 78.2050, area: 5, openingTime: "08:00", closingTime: "18:00", amenities: ["Rose Garden", "Viewpoint", "Walking Trails"] },
      { name: "Kurumbapatti Zoological Park", description: "A small zoo at the foot of the Shevaroy Hills with spotted deer, crocodiles and birds in natural enclosures.", address: "Kurumbapatti, Salem", latitude: 11.6840, longitude: 78.2030, area: 78, openingTime: "09:00", closingTime: "17:00", amenities: ["Zoo", "Children's Playground", "Parking"] },
    ],
    libraries: [
      { name: "District Central Library, Salem", address: "Salem", openingTime: "08:00", closingTime: "20:00", totalBooks: 105000, books: [
        book("Malgudi Days", "R. K. Narayan", "Short Stories", 1943),
        book("Koolamaadhari", "Perumal Murugan", "Novel", null),
        book("Eru Veyyil", "Perumal Murugan", "Novel", null),
      ] },
    ],
    routes: [
      { code: "SLM-1", name: "New Bus Stand — Yercaud", type: "bus", origin: "Salem New Bus Stand", destination: "Yercaud", frequency: 30, operatingHours: "05:30–20:00", fare: 30, totalStops: 8, alert: { title: "Yercaud Summer Festival traffic", message: "Expect heavy traffic on the Yercaud ghat road during the Summer Festival in May; allow extra travel time.", severity: "info" } },
      { code: "SLM-2", name: "New Bus Stand — Mettur Dam", type: "bus", origin: "Salem New Bus Stand", destination: "Mettur Dam", frequency: 20, operatingHours: "05:00–21:30", fare: 40, totalStops: 14 },
      { code: "SLM-3", name: "Old Bus Stand — Salem Junction", type: "bus", origin: "Salem Old Bus Stand", destination: "Salem Junction Railway Station", frequency: 10, operatingHours: "05:00–22:30", fare: 10, totalStops: 8 },
    ],
  },
  {
    name: "Tirunelveli", slug: "tirunelveli",
    parkingLots: [
      { name: "Tirunelveli Junction Railway Station Parking", address: "Tirunelveli Junction, Tirunelveli 627001", latitude: 8.7290, longitude: 77.7090, totalSpots: 200, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Two-wheeler Bay"] },
      { name: "Tirunelveli New Bus Stand Parking", address: "New Bus Stand, Tirunelveli", latitude: 8.7040, longitude: 77.7330, totalSpots: 240, pricePerHour: 15, openingTime: "05:00", closingTime: "23:00", amenities: ["CCTV", "Two-wheeler Bay"] },
      { name: "Nellaiappar Temple Parking", address: "Tirunelveli Town, Tirunelveli 627006", latitude: 8.7280, longitude: 77.6860, totalSpots: 120, pricePerHour: 20, openingTime: "05:00", closingTime: "21:30", amenities: ["CCTV", "Restrooms"] },
    ],
    parks: [
      { name: "Koonthankulam Bird Sanctuary", description: "Tamil Nadu's largest reserve for breeding water birds; painted storks and pelicans nest here between December and June.", address: "Koonthankulam, Nanguneri Taluk, Tirunelveli", latitude: 8.4950, longitude: 77.7540, area: 320, openingTime: "06:00", closingTime: "18:00", amenities: ["Bird Watching", "Watch Tower", "Walking Trails"] },
      { name: "Manimuthar Dam Park", description: "A park below the Manimuthar dam at the foot of the Western Ghats, close to Manimuthar Falls.", address: "Manimuthar, Ambasamudram Taluk, Tirunelveli", latitude: 8.6380, longitude: 77.4290, area: 12, openingTime: "08:00", closingTime: "18:00", amenities: ["Picnic Area", "Children's Playground", "Viewpoint"] },
    ],
    libraries: [
      { name: "District Central Library, Tirunelveli", address: "Palayamkottai, Tirunelveli", openingTime: "08:00", closingTime: "20:00", totalBooks: 100000, books: [
        book("Gopalla Gramam", "Ki. Rajanarayanan", "Novel", null),
        book("Karukku", "Bama", "Autobiography", 1992),
        book("Koogai", "Cho. Dharman", "Novel", null),
      ] },
    ],
    routes: [
      { code: "TEN-1", name: "Junction — Palayamkottai", type: "bus", origin: "Tirunelveli Junction Bus Stand", destination: "Palayamkottai Bus Stand", frequency: 5, operatingHours: "04:30–23:00", fare: 10, totalStops: 8 },
      { code: "TEN-2", name: "New Bus Stand — Papanasam", type: "bus", origin: "Tirunelveli New Bus Stand", destination: "Papanasam", frequency: 20, operatingHours: "05:00–21:00", fare: 40, totalStops: 16 },
      { code: "TEN-3", name: "New Bus Stand — Tiruchendur", type: "bus", origin: "Tirunelveli New Bus Stand", destination: "Tiruchendur", frequency: 15, operatingHours: "04:30–22:00", fare: 45, totalStops: 14 },
    ],
  },
  {
    name: "Thanjavur", slug: "thanjavur",
    parkingLots: [
      { name: "Brihadeeswarar Temple Parking", address: "Membalam Road, Thanjavur 613001", latitude: 10.7828, longitude: 79.1318, totalSpots: 250, pricePerHour: 20, openingTime: "05:30", closingTime: "21:30", amenities: ["CCTV", "Restrooms", "Two-wheeler Bay"] },
      { name: "Thanjavur Junction Railway Station Parking", address: "Railway Station Road, Thanjavur 613001", latitude: 10.7790, longitude: 79.1380, totalSpots: 180, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV"] },
      { name: "Thanjavur New Bus Stand Parking", address: "New Bus Stand, Thanjavur 613005", latitude: 10.7640, longitude: 79.1090, totalSpots: 220, pricePerHour: 15, openingTime: "05:00", closingTime: "23:00", amenities: ["CCTV", "Two-wheeler Bay"] },
    ],
    parks: [
      { name: "Sivaganga Park", description: "A heritage park around the Sivaganga tank beside the Brihadeeswarar Temple, with a small zoo and boating.", address: "Near Brihadeeswarar Temple, Thanjavur 613001", latitude: 10.7850, longitude: 79.1350, area: 9, openingTime: "09:00", closingTime: "19:00", amenities: ["Boating", "Children's Playground", "Mini Zoo"] },
      { name: "Rajarajan Manimandapam", description: "A memorial to Raja Raja Chola I with a garden, a small museum and a viewing tower.", address: "Thanjavur 613001", latitude: 10.7740, longitude: 79.1320, area: 4, openingTime: "09:00", closingTime: "18:00", amenities: ["Garden", "Museum", "Viewpoint"] },
    ],
    libraries: [
      { name: "Saraswathi Mahal Library", address: "Thanjavur Palace, Thanjavur 613009", openingTime: "10:00", closingTime: "17:30", totalBooks: 60000, books: [
        book("Kamba Ramayanam", "Kambar", "Classical Literature", null, 4),
      ] },
      { name: "District Central Library, Thanjavur", address: "Thanjavur", openingTime: "08:00", closingTime: "20:00", totalBooks: 95000, books: [
        book("Moga Mul", "T. Janakiraman", "Novel", null),
        book("Amma Vandhaal", "T. Janakiraman", "Novel", null),
      ] },
    ],
    routes: [
      { code: "TJ-1", name: "New Bus Stand — Old Bus Stand", type: "bus", origin: "Thanjavur New Bus Stand", destination: "Thanjavur Old Bus Stand", frequency: 5, operatingHours: "04:30–23:00", fare: 10, totalStops: 7 },
      { code: "TJ-2", name: "Thanjavur — Kumbakonam", type: "bus", origin: "Thanjavur New Bus Stand", destination: "Kumbakonam", frequency: 10, operatingHours: "04:30–22:30", fare: 35, totalStops: 12 },
      { code: "TJ-3", name: "Thanjavur — Thiruvaiyaru", type: "bus", origin: "Thanjavur Old Bus Stand", destination: "Thiruvaiyaru", frequency: 15, operatingHours: "05:00–22:00", fare: 12, totalStops: 9, alert: { title: "Thyagaraja Aradhana", message: "Extra buses run to Thiruvaiyaru during the Thyagaraja Aradhana music festival in January.", severity: "info" } },
    ],
  },
  {
    name: "Vellore", slug: "vellore",
    parkingLots: [
      { name: "Katpadi Junction Railway Station Parking", address: "Katpadi, Vellore 632007", latitude: 12.9710, longitude: 79.1380, totalSpots: 260, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Two-wheeler Bay"] },
      { name: "Vellore Fort Parking", address: "Fort Round Road, Vellore 632004", latitude: 12.9206, longitude: 79.1290, totalSpots: 150, pricePerHour: 20, openingTime: "06:00", closingTime: "21:00", amenities: ["CCTV", "Restrooms"] },
      { name: "Sripuram Golden Temple Parking", address: "Thirumalaikodi, Vellore 632055", latitude: 12.8730, longitude: 79.0890, totalSpots: 500, pricePerHour: 20, openingTime: "04:00", closingTime: "21:00", amenities: ["CCTV", "Restrooms", "Disabled Access"] },
    ],
    parks: [
      { name: "Amirthi Zoological Park", description: "A forest park in the Javadhu Hills foothills with a small zoo, a waterfall trail and picnic spots.", address: "Amirthi, Vellore", latitude: 12.7340, longitude: 79.0560, area: 60, openingTime: "09:00", closingTime: "17:00", amenities: ["Zoo", "Waterfall Trail", "Picnic Area"] },
      { name: "Vellore Fort Grounds", description: "Open grounds and ramparts around the 16th-century Vellore Fort and its moat, with the Government Museum inside.", address: "Vellore Fort, Vellore 632004", latitude: 12.9210, longitude: 79.1300, area: 133, openingTime: "06:00", closingTime: "20:00", amenities: ["Walking Trails", "Museum", "Heritage Site"] },
    ],
    libraries: [
      { name: "District Central Library, Vellore", address: "Vellore", openingTime: "08:00", closingTime: "20:00", totalBooks: 90000, books: [
        book("Puyalile Oru Thoni", "Pa. Singaram", "Novel", null),
        book("Thanneer", "Ashokamitran", "Novel", null),
        book("18vathu Atchakkodu", "Ashokamitran", "Novel", null),
      ] },
    ],
    routes: [
      { code: "VLR-1", name: "New Bus Stand — Katpadi", type: "bus", origin: "Vellore New Bus Stand", destination: "Katpadi Junction", frequency: 5, operatingHours: "04:30–23:00", fare: 10, totalStops: 9 },
      { code: "VLR-2", name: "New Bus Stand — Golden Temple", type: "bus", origin: "Vellore New Bus Stand", destination: "Sripuram Golden Temple", frequency: 15, operatingHours: "05:00–21:00", fare: 12, totalStops: 8 },
      { code: "VLR-3", name: "New Bus Stand — VIT", type: "bus", origin: "Vellore New Bus Stand", destination: "VIT University, Katpadi", frequency: 10, operatingHours: "05:30–22:00", fare: 12, totalStops: 10 },
    ],
  },
  {
    name: "Erode", slug: "erode",
    parkingLots: [
      { name: "Erode Junction Railway Station Parking", address: "Railway Colony, Erode 638002", latitude: 11.3300, longitude: 77.7280, totalSpots: 220, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV", "Two-wheeler Bay"] },
      { name: "Erode Central Bus Stand Parking", address: "Central Bus Stand, Erode 638001", latitude: 11.3440, longitude: 77.7170, totalSpots: 240, pricePerHour: 15, openingTime: "05:00", closingTime: "23:00", amenities: ["CCTV", "Two-wheeler Bay"] },
      { name: "Bhavanisagar Dam Parking", address: "Bhavanisagar, Erode 638451", latitude: 11.4730, longitude: 77.1170, totalSpots: 200, pricePerHour: 20, openingTime: "08:00", closingTime: "18:00", amenities: ["Restrooms", "CCTV"] },
    ],
    parks: [
      { name: "V.O.C. Park, Erode", description: "Erode's central civic park with lawns, a children's play area and a stadium next door.", address: "V.O.C. Park Road, Erode 638001", latitude: 11.3470, longitude: 77.7270, area: 12, openingTime: "05:30", closingTime: "20:00", amenities: ["Children's Playground", "Walking Trails", "Outdoor Gym"] },
      { name: "Bhavanisagar Dam Park", description: "A large garden below one of India's biggest earthen dams on the Bhavani river.", address: "Bhavanisagar, Erode 638451", latitude: 11.4730, longitude: 77.1150, area: 25, openingTime: "08:00", closingTime: "18:00", amenities: ["Garden", "Children's Playground", "Picnic Area"] },
      { name: "Kodiveri Dam", description: "A historic check dam on the Bhavani river with a riverside picnic area, popular for its cascading water.", address: "Kodiveri, Gobichettipalayam, Erode", latitude: 11.4790, longitude: 77.2990, area: 6, openingTime: "08:00", closingTime: "18:00", amenities: ["Riverside", "Picnic Area", "Viewpoint"] },
    ],
    libraries: [
      { name: "District Central Library, Erode", address: "Erode", openingTime: "08:00", closingTime: "20:00", totalBooks: 95000, books: [
        book("Madhorubagan", "Perumal Murugan", "Novel", 2010),
        book("Pookkuzhi", "Perumal Murugan", "Novel", null),
        book("Nizhal Mutram", "Perumal Murugan", "Novel", null),
      ] },
    ],
    routes: [
      { code: "ED-1", name: "Central Bus Stand — Bhavani", type: "bus", origin: "Erode Central Bus Stand", destination: "Bhavani", frequency: 8, operatingHours: "04:30–23:00", fare: 15, totalStops: 9 },
      { code: "ED-2", name: "Central Bus Stand — Perundurai", type: "bus", origin: "Erode Central Bus Stand", destination: "Perundurai", frequency: 10, operatingHours: "05:00–22:30", fare: 18, totalStops: 10 },
      { code: "ED-3", name: "Central Bus Stand — Chennimalai", type: "bus", origin: "Erode Central Bus Stand", destination: "Chennimalai", frequency: 15, operatingHours: "05:00–21:30", fare: 25, totalStops: 12 },
    ],
  },
  {
    name: "Kanyakumari", slug: "kanyakumari",
    parkingLots: [
      { name: "Kanyakumari Ferry Point Parking", address: "Near Vivekananda Rock Memorial ferry, Kanyakumari 629702", latitude: 8.0790, longitude: 77.5500, totalSpots: 300, pricePerHour: 30, openingTime: "05:00", closingTime: "21:00", amenities: ["CCTV", "Restrooms", "Two-wheeler Bay"] },
      { name: "Nagercoil Junction Railway Station Parking", address: "Kottar, Nagercoil 629002", latitude: 8.1700, longitude: 77.4400, totalSpots: 180, pricePerHour: 15, openingTime: "00:00", closingTime: "23:59", amenities: ["24/7", "CCTV"] },
      { name: "Vadasery Bus Stand Parking", address: "Vadasery, Nagercoil 629001", latitude: 8.1890, longitude: 77.4180, totalSpots: 200, pricePerHour: 15, openingTime: "05:00", closingTime: "23:00", amenities: ["CCTV", "Two-wheeler Bay"] },
    ],
    parks: [
      { name: "Udayagiri Fort Biodiversity Park", description: "An 18th-century fort turned biodiversity park with a deer enclosure, bird aviary and the tomb of Eustachius De Lannoy.", address: "Puliyoorkurichi, Kanyakumari", latitude: 8.2440, longitude: 77.3330, area: 90, openingTime: "09:00", closingTime: "17:30", amenities: ["Deer Park", "Walking Trails", "Heritage Site"] },
      { name: "Vattakottai Fort", description: "A granite seaside fort with sea views on three sides and a lawn inside the walls.", address: "Vattakottai, Kanyakumari", latitude: 8.1230, longitude: 77.5640, area: 3, openingTime: "08:00", closingTime: "17:00", amenities: ["Sea View", "Heritage Site", "Lawn"] },
    ],
    libraries: [
      { name: "District Central Library, Nagercoil", address: "Nagercoil, Kanyakumari", openingTime: "08:00", closingTime: "20:00", totalBooks: 90000, books: [
        book("Oru Puliyamarathin Kathai", "Sundara Ramaswamy", "Novel", 1966),
        book("Vishnupuram", "Jeyamohan", "Novel", 1997),
        book("Aram", "Jeyamohan", "Short Stories", 2011),
      ] },
    ],
    routes: [
      { code: "NCJ-1", name: "Vadasery — Kanyakumari", type: "bus", origin: "Vadasery Bus Stand", destination: "Kanyakumari", frequency: 10, operatingHours: "04:30–22:30", fare: 20, totalStops: 11, alert: { title: "Rock Memorial ferry", message: "The ferry to the Vivekananda Rock Memorial pauses when the sea is rough; check at the ferry point before you travel.", severity: "info" } },
      { code: "NCJ-2", name: "Anna Bus Stand — Colachel", type: "bus", origin: "Anna Bus Stand, Nagercoil", destination: "Colachel", frequency: 15, operatingHours: "05:00–22:00", fare: 20, totalStops: 12 },
      { code: "NCJ-3", name: "Vadasery — Thuckalay", type: "bus", origin: "Vadasery Bus Stand", destination: "Thuckalay", frequency: 10, operatingHours: "05:00–22:00", fare: 15, totalStops: 10 },
    ],
  },
];
