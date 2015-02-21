--
-- Database: `grouper`
--

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `group` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `group_vote` (
  `post` int(11) DEFAULT NULL,
  `group` int(11) DEFAULT NULL,
  `up` int(11) DEFAULT 0,
  `down` int(11) DEFAULT 0,
  `total` int(11) DEFAULT 0,
  `percentage_up` float DEFAULT 0.0,
  `rank` float DEFAULT 0.0,
  PRIMARY KEY (`post`, `group`),
  INDEX(`rank`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `post` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `title` varchar(255) DEFAULT NULL,
  `url` varchar(255) DEFAULT NULL,
  `user` int(11) DEFAULT NULL,
  `up` int(11) DEFAULT 0,
  `down` int(11) DEFAULT 0,
  `total` int(11) DEFAULT 0,
  `percentage_up` float DEFAULT 0.0,
  `rank` float DEFAULT 0.0,
  `created` int NOT NULL DEFAULT 0, 
  PRIMARY KEY (`id`),
  INDEX(`user`),
  INDEX(`total`),
  INDEX(`percentage_up`),
  INDEX(`created`),
  INDEX(`rank`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `user_group_agreement` (
  `user` int(11) DEFAULT NULL,
  `group` int(11) DEFAULT NULL,
  `up` int(11) DEFAULT 0,
  `down` int(11) DEFAULT 0,
  `total` int(11) DEFAULT 0,
  `percentage_up` float DEFAULT 0,
  `created` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`user`, `group`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

--
-- Table structure for table `Users`
--

CREATE TABLE IF NOT EXISTS `user` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `email` varchar(255) DEFAULT NULL,
  `username` varchar(255) DEFAULT NULL,
  `password` varchar(255) DEFAULT NULL,
  `group` int(11) NOT NULL DEFAULT 0,
  `created` datetime NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  UNIQUE KEY `username` (`username`),
  INDEX(`group`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

-- --------------------------------------------------------

CREATE TABLE IF NOT EXISTS `user_vote` (
  `vote` tinyint(1) DEFAULT NULL,
  `user` int(11) DEFAULT NULL,
  `post` int(11) DEFAULT NULL,
  `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`user`, `post`),
  INDEX(`created`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;

CREATE TABLE IF NOT EXISTS `group_agreement` (
  `group_a` int(11) DEFAULT NULL,
  `group_b` int(11) DEFAULT NULL,
  `created` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `disagreement_average` float DEFAULT 0,
  PRIMARY KEY (`group_a`, `group_b`),
  INDEX(`disagreement_average`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1 AUTO_INCREMENT=1 ;