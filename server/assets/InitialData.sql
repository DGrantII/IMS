INSERT INTO Employees (employeeID, firstName, lastName, passwordHash, role)
VALUES ('3852922', 'Susan', 'Lassiter', '$2b$10$/RporUkW6s39uhEm9vlUtO/q/TCnLl8HvKyyEA.QimweKFJYMkKcW', 'Standard');
INSERT INTO Employees (employeeID, firstName, lastName, passwordHash, role)
VALUES ('3852923', 'Anthony', 'Elanga', '$2b$10$3UEsOMk9M1KNCj3Ya1Z2KOJLLf/pkPkTpbi4mF6eAq.8S4U7Z99Em', 'Privileged');
INSERT INTO Employees (employeeID, firstName, lastName, passwordHash, role)
VALUES ('3852924', 'Braden', 'Armstrong', '$2b$10$y76ByUfg8g2EUFgeYIXbUuNJmf5pSPMe3VmMlWI7Wzukr3F5fG2EO', 'Admin');

INSERT INTO Customers (firstName, lastName, phoneNumber, email)
VALUES ('Jonathan', 'Sandoval', '123-555-3245', 'jsan@example.com');
INSERT INTO Customers (firstName, lastName, phoneNumber, email)
VALUES ('Gabriel', 'Norgrove', '456-555-8329', 'gabe.nor@example.com');
INSERT INTO Customers (firstName, lastName, phoneNumber, email)
VALUES ('Samantha', 'Billings', '932-555-2891', 'billings323@example.com');
INSERT INTO Customers (firstName, lastName, phoneNumber, email)
VALUES ('Eva', 'Mings', '320-555-5424', 'mina121@example.com');

INSERT INTO Items (sku, upc, brand, model, description, availableQuantity, price)
VALUES ('1900000', '889523052693', 'GIGABYTE', 'GV-N5050OC-8GL', 'GIGABYTE - GeForce RTX 5050 8GB GDDR6 PCI Express 5.0 Graphics Card - Black', '3', '317.99');
INSERT INTO Items (sku, upc, brand, model, description, availableQuantity, price)
VALUES ('1900001', '840191503429', 'XFX', 'RX-96TS316W7', 'XFX - Swift AMD Radeon RX 9060XT 16GB GDDR6 PCI Express 5.0 Graphics Card - White', '1', '479.99');
INSERT INTO Items (sku, upc, brand, model, description, availableQuantity, price)
VALUES ('1900002', '840006674900', 'Corsair', 'CMH32GX5M2E6000C36W', 'Corsair - Vengeance RGB 32GB (2x16GB) DDR5 6000MHz C36 UDIMM Desktop Memory - White', '2', '393.99');
INSERT INTO Items (sku, upc, brand, model, description, availableQuantity, orderQuantity, price)
VALUES ('1900003', '842243025484', 'ADATA', 'AGAMMIXS70B-1T-CS', 'ADATA - XPG GAMMIX S70 Blade 1TB Internal SSD PCIe Gen 4 x4 with Heatsink for PS5', '0', '1', '179.99');
INSERT INTO Items (sku, upc, brand, model, description, availableQuantity, price)
VALUES ('1900004', '889523049761', 'Alienware', 'AW510K-L', 'Alienware - AW510K Full-size Wired Mechanical CHERRY MX Low Profile Red Switch Gaming Keyboard with RGB Back Lighting for PC - Lunar Light', '1', '129.99');
INSERT INTO Items (sku, upc, brand, model, description, availableQuantity, inTransit, price)
VALUES ('1900005', '840272921715', 'Razer', 'RZ03-05530200-R3U1', 'Razer - Huntsman V3 Pro 8KHz Full Size Wired Analog Optical Linear Switch Gaming Keyboard with Snap Tap - Black', '1', '1', '249.99');
INSERT INTO Items (sku, upc, brand, model, description, availableQuantity, price)
VALUES ('1900006', '811842082662', 'CyberPower', 'SLC4400BSDFV6', 'CyberPowerPC - Gaming Desktop - AMD Ryzen 7 7800X3D - AMD Radeon RX 9070 XT 16GB - 32GB DDR5 - 2TB PCIe 4.0 SSD - Black', '1', '1899.99');
INSERT INTO Items (sku, upc, brand, model, description, availableQuantity, orderQuantity, inTransit, price)
VALUES ('1900007', '811842082549', 'CyberPower', 'GXi3800BST', 'CyberPowerPC - Gaming Desktop - Intel Core i9-14900F - NVIDIA GeForce RTX 5070 12GB - 32GB DDR5 - 1TB PCIe 4.0 SSD - Black', '0', '1', '1', '1699.99');
INSERT INTO Items (sku, upc, brand, model, description, availableQuantity, inTransit, price)
VALUES ('1900008', '840272909157', 'Razer', 'RZ01-04000300-R3U1', 'Razer - Basilisk V3 Optical Gaming Mouse with Chroma RGB Lighting - Wired - White', '0', '3', '49.99');

INSERT INTO Manifests (manifestNumber, trackingNumber, status, createDate, receiveDate, receivedBy)
VALUES ('54900', '1Z999AA10123456784', 'Received', '2026-03-24', '2026-04-02', '3852922');
INSERT INTO Manifests (manifestNumber, status, createDate)
VALUES ('54901', 'Shipped', '2026-03-28');
INSERT INTO Manifests (manifestNumber, trackingNumber, status, createDate)
VALUES ('54902', '1Z999AA10582926784', 'Shipped', '2026-03-19');
INSERT INTO Manifests (manifestNumber, status, createDate, receiveDate, receivedBy)
VALUES ('54903', 'Received', '2026-04-01', '2026-04-05', '3852922');

INSERT INTO ManifestItems (sku, manifestNumber, quantity)
VALUES ('1900000', '54900', '2');
INSERT INTO ManifestItems (sku, manifestNumber, quantity)
VALUES ('1900002', '54900', '1');
INSERT INTO ManifestItems (sku, manifestNumber, quantity)
VALUES ('1900007', '54901', '1');
INSERT INTO ManifestItems (sku, manifestNumber, quantity)
VALUES ('1900005', '54902', '1');
INSERT INTO ManifestItems (sku, manifestNumber, quantity)
VALUES ('1900008', '54902', '3');
INSERT INTO ManifestItems (sku, manifestNumber, quantity)
VALUES ('1900006', '54903', '1');
INSERT INTO ManifestItems (sku, manifestNumber, quantity)
VALUES ('1900000', '54903', '1');

INSERT INTO InventoryAdjustments (inventoryAdjustmentID, reason, createDate, adjustedBy)
VALUES ('2310', 'Stolen', '2026-04-12', '3852923');

INSERT INTO InventoryAdjustmentItems (inventoryAdjustmentID, sku, quantityBefore, quantityAfter, cost)
VALUES ('2310', '1900005', '2', '1', '-249.99'); 