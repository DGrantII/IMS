CREATE TABLE Employees (
    employeeID INT,
    firstName VARCHAR(50) NOT NULL,
    lastName VARCHAR(50) NOT NULL,
    passwordHash VARCHAR(255) NOT NULL,
    role ENUM('Privileged', 'Standard', 'Admin') NOT NULL DEFAULT 'Standard',
    createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (employeeID)
);

CREATE TABLE Items (
	sku INT AUTO_INCREMENT PRIMARY KEY,
    upc VARCHAR(50) NOT NULL,
    status ENUM('Active', 'Deleted', 'Discontinued') DEFAULT 'Active',
    model VARCHAR(50) NOT NULL,
    brand VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    availableQuantity INT DEFAULT 0,
    orderQuantity INT DEFAULT 0,
    inTransit INT DEFAULT 0,
    price DECIMAL(10, 2) DEFAULT 0
);
ALTER TABLE Items AUTO_INCREMENT = 1900000;

CREATE TABLE Manifests (
	manifestNumber INT AUTO_INCREMENT PRIMARY KEY,
    trackingNumber VARCHAR(50),
    status ENUM('Shipped', 'Received') NOT NULL DEFAULT 'Shipped',
    createDate DATE DEFAULT (CURRENT_DATE),
    receiveDate DATE,
    receivedBy INT,
    FOREIGN KEY (receivedBy) REFERENCES Employees(employeeID)
);
ALTER TABLE Manifests AUTO_INCREMENT = 54900;

CREATE TABLE ManifestItems (
	sku int,
    manifestNumber int,
    quantity int,
    PRIMARY KEY (sku, manifestNumber),
    FOREIGN KEY (sku) REFERENCES Items(sku),
    FOREIGN KEY (manifestNumber) REFERENCES Manifests(manifestNumber)
);

CREATE TABLE Customers (
	customerID int NOT NULL AUTO_INCREMENT,
    firstName varchar(50),
    lastName varchar(50),
    phoneNumber varchar(50),
    email varchar(50),
    PRIMARY KEY (customerID)
);

CREATE TABLE Orders (
	orderNumber int,
    createDate date,
    customerID int,
    PRIMARY KEY (orderNumber),
    FOREIGN KEY (customerID) REFERENCES Customers(customerID)
);

CREATE TABLE OrderItems (
	sku int,
    orderNumber int,
    quantity int,
    PRIMARY KEY (sku, orderNumber),
    FOREIGN KEY (sku) REFERENCES Items(sku),
    FOREIGN KEY (orderNumber) REFERENCES Orders(orderNumber)
);

CREATE TABLE InventoryAdjustments (
	inventoryAdjustmentID INT AUTO_INCREMENT PRIMARY KEY,
    status ENUM('Suspended', 'Completed') NOT NULL DEFAULT 'Suspended',
    reason varchar(255),
    createDate DATE NOT NULL,
    adjustedBy INT NOT NULL,
    FOREIGN KEY (adjustedBy) REFERENCES Employees(employeeID)
);
ALTER TABLE InventoryAdjustments AUTO_INCREMENT = 2309;

CREATE TABLE InventoryAdjustmentItems (
	inventoryAdjustmentID INT,
    sku INT,
    variance INT NOT NULL,
    cost DECIMAL(10, 2) NOT NULL,
    PRIMARY KEY (inventoryAdjustmentID, sku),
    FOREIGN KEY (sku) REFERENCES Items(sku),
    FOREIGN KEY (inventoryAdjustmentID) REFERENCES InventoryAdjustments(inventoryAdjustmentID)
);