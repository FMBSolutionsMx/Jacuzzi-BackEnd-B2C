USE [Handel]
GO

SET ANSI_NULLS ON
GO

SET QUOTED_IDENTIFIER ON
GO

CREATE TABLE [dbo].[handel_profile](
	[CardCode] [nvarchar](16) NOT NULL,
	[Favorites] [nvarchar](max) NULL,
	[ShoppingCart] [nvarchar](max) NULL,
	[BackOrder] [nvarchar](max) NULL,
 CONSTRAINT [PK_handel_profile] PRIMARY KEY CLUSTERED 
(
	[CardCode] ASC
)WITH (PAD_INDEX = OFF, STATISTICS_NORECOMPUTE = OFF, IGNORE_DUP_KEY = OFF, ALLOW_ROW_LOCKS = ON, ALLOW_PAGE_LOCKS = ON) ON [PRIMARY]
) ON [PRIMARY] TEXTIMAGE_ON [PRIMARY]
GO

